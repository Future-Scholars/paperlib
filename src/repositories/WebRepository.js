import { XMLParser } from "fast-xml-parser";
import got from "got";
import { formatString } from "../utils/misc";
import FormData from "form-data";
import fs from "fs";

export class WebRepository {
  constructor(preference) {
    this.preference = preference;
    this.xmlParser = new XMLParser();
  }

  async fetch(entity) {
    entity = await this.fetchArxiv(entity);
    entity = await this.fetchDOI(entity);
    entity = await this.fetchTitleExtractor(entity);
    entity = await this.fetchDBLP(entity);
    entity = await this.fetchDBLP(entity, 1);
    entity = await this.fetchDBLP(entity, 0);
    entity = await this.fetchIEEE(entity);

    return entity;
  }

  async fetchArxiv(entity) {
    try {
      if (entity.arxiv) {
        let arxivId = formatString({ str: entity.arxiv, removeStr: "arXiv:" });
        let response = await got(
          "https://export.arxiv.org/api/query?id_list=" + arxivId,
          {
            headers: {
              "accept-encoding": "UTF-32BE",
            },
          }
        );
        let arxivResponse = this.xmlParser.parse(response.body).feed.entry;
        let title = arxivResponse.title;
        let authorList = arxivResponse.author;
        let authors = authorList
          .map((author) => {
            return author.name;
          })
          .join(", ");
        let pubTime = arxivResponse.published.substring(0, 4);

        entity.setValue("title", title, false);
        entity.setValue("authors", authors, false);
        entity.setValue("pubTime", pubTime, false);
        entity.setValue("pubType", 0, false);
        entity.setValue("publication", "arXiv", false);
      }
      return entity;
    } catch (error) {
      console.error("Arxiv request error.");
      console.error(error);
      return entity;
    }
  }

  async fetchDOI(entity) {
    try {
      if (entity.doi) {
        let doi = entity.doi;
        let response = await got("https://dx.doi.org/" + doi, {
          headers: {
            Accept: "application/json",
          },
        });
        let doiResponse = JSON.parse(response.body);
        let title = doiResponse.title;
        let authors = doiResponse.author
          .map((author) => {
            return author.given + " " + author.family;
          })
          .join(", ");
        let pubTime = doiResponse.published["date-parts"]["0"][0];
        var pubType;
        if (doiResponse.type == "proceedings-article") {
          pubType = 1;
        } else if (doiResponse.type == "journal-article") {
          pubType = 0;
        } else {
          pubType = 2;
        }
        let publication = doiResponse["container-title"];

        entity.setValue("title", title, false);
        entity.setValue("authors", authors, false);
        entity.setValue("pubTime", pubTime, false);
        entity.setValue("pubType", pubType, false);
        entity.setValue("publication", publication, false);
      }
      return entity;
    } catch (error) {
      console.error("DOI request error.");
      console.error(error);
      return entity;
    }
  }

  async fetchTitleExtractor(entity) {
    try {
      if (!entity.title) {
        const form = new FormData();
        form.append("file", fs.createReadStream(entity.mainURL));

        let response = await got
          .post("https://paperlib.geoch.top/api/files/upload/", {
            body: form,
          })
          .json();

        let title = response.title;
        entity.setValue("title", title, false);
      }
      return entity;
    } catch (error) {
      console.error("Title Extractor request error.");
      console.error(error);
      return entity;
    }
  }

  async fetchIEEE(entity) {
    try {
      if (
        entity.title &&
        (entity.publication == "arXiv" || !entity.publication) && this.preference.get("ieeeAPIKey")
      ) {
        let requestTitle = formatString({
          str: entity.title,
          removeNewline: true,
        }).replace(/\s/g, "+");

        let apiKey = this.preference.get("ieeeAPIKey");

        let ieeeResponse = await got(
          "http://ieeexploreapi.ieee.org/api/v1/search/articles?apikey=" +
            apiKey +
            "&format=json&max_records=25&start_record=1&sort_order=asc&sort_field=article_number&article_title=" +
            requestTitle,
          {
            headers: {
              Accept: "application/json",
            },
          }
        ).json();
        if (ieeeResponse.total_records > 0) {
          for (const article of ieeeResponse.articles) {
            var plainHitTitle = formatString({
              str: article.title,
              removeStr: "&amp",
            });
            plainHitTitle = formatString({
              str: plainHitTitle,
              removeSymbol: true,
              lowercased: true,
            });

            var existTitle = formatString({
              str: entity.title,
              removeStr: "&amp",
            });
            existTitle = formatString({
              str: existTitle,
              removeSymbol: true,
              lowercased: true,
            });

            if (plainHitTitle != existTitle) {
              continue;
            } else {
              let title = article.title.replace("&amp;", "&");
              let authors = article.authors.authors
                .map((author) => {
                  return author.full_name.trim();
                })
                .join(", ");

              let pubTime = article.publication_year;
              var pubType;

              if (
                article.content_type.includes("Journals") ||
                article.content_type.includes("Article")
              ) {
                pubType = 0;
              } else if (article.content_type.includes("Conferences")) {
                pubType = 1;
              } else {
                pubType = 2;
              }

              let publication = article.publication_title;
              entity.setValue("title", title, false);
              entity.setValue("authors", authors, false);
              entity.setValue("pubTime", pubTime, false);
              entity.setValue("pubType", pubType, false);
              entity.setValue("publication", publication, false);

              break;
            }
          }
        }
      }
      return entity;
    } catch (error) {
      console.error("IEEE request error.");
      console.error(error);
      return entity;
    }
  }

  async fetchDBLP(entity, yearOffset) {
    try {
      var dblpQuery = formatString({ str: entity.title, removeStr: "&amp" });
      dblpQuery = formatString({
        str: dblpQuery,
        removeStr: "&",
      }).replace("—", "-");

      if (yearOffset != null) {
        if (!entity.publication || entity.publication == "arXiv") {
          let pubTime = parseInt(entity.pubTime);
          dblpQuery = dblpQuery + " year:" + (pubTime + yearOffset);
        } else {
          return entity;
        }
      }

      if (dblpQuery) {
        let dblpResponse = await got(
          "https://dblp.org/search/publ/api?q=" + dblpQuery + "&format=json"
        ).json();
        if (dblpResponse.result.hits["@sent"] > 0) {
          for (const hit of dblpResponse.result.hits.hit) {
            let article = hit.info;

            var plainHitTitle = formatString({
              str: article.title,
              removeStr: "&amp",
            });
            plainHitTitle = formatString({
              str: plainHitTitle,
              removeSymbol: true,
              lowercased: true,
            });

            var existTitle = formatString({
              str: entity.title,
              removeStr: "&amp",
            });
            existTitle = formatString({
              str: existTitle,
              removeSymbol: true,
              lowercased: true,
            });

            if (plainHitTitle != existTitle) {
              continue;
            } else {
              let title = article.title.replace("&amp;", "&");

              let authorList = [];
              let authorResponse = article.authors.author;

              if ("@pid" in authorResponse) {
                authorList.push(authorResponse.text.trim());
              } else {
                for (const author of authorResponse) {
                  authorList.push(author.text.trim());
                }
              }
              let authors = authorList.join(", ");

              let pubTime = article.year;
              var pubType;
              if (article.type.includes("Journal")) {
                pubType = 0;
              } else if (article.type.includes("Conference")) {
                pubType = 1;
              } else {
                pubType = 2;
              }
              let pubKey = article.key.split("/").slice(0, 2).join("/");

              if (pubKey != "journals/corr") {
                entity.setValue("title", title, false);
                entity.setValue("authors", authors, false);
                entity.setValue("pubTime", pubTime, false);
                entity.setValue("pubType", pubType, false);
                let publication = await this.fetchDBLPVenue(pubKey);
                entity.setValue("publication", publication, false);
              }
              break;
            }
          }
        }
      }
      return entity;
    } catch (error) {
      console.error("DBLP request error.");
      console.error(error);
      return entity;
    }
  }

  async fetchDBLPVenue(venueKey) {
    try {
      if (venueKey) {
        let venueResponse = await got(
          "https://dblp.org/search/venue/api?q=" + venueKey + "&format=json"
        ).json();
        if (venueResponse.result.hits["@sent"] > 0) {
          venueKey = venueResponse.result.hits.hit[0].info.venue;
        }
      }
      return venueKey;
    } catch (error) {
      console.error("DBLP Venue request error.");
      console.error(error);
      return venueKey;
    }
  }
}

<div align="center">

**English** | [中文](./README_CN.md)

</div>
<div align="center">
<img src="./assets/icon.png" height="95" />
<br />
<img src="https://img.shields.io/badge/dynamic/json?label=Release&query=version&url=https://raw.githubusercontent.com/Future-Scholars/paperlib/master/package.json" />
<img src="https://img.shields.io/github/license/Future-Scholars/paperlib" />
<img src="https://img.shields.io/github/stars/Future-Scholars/paperlib" />
<h2><a href="https://paperlib.app/" > Paperlib </a></h2>
An open-source reference manager.
</div>

<p align='center'>
Join our <a href="https://discord.gg/4unrSRjcM9">Discord community</a>!
</p>
<p align='center'>
📣 <b>Seeking contributors</b> 📣
</p>
<p align='center'>
If you are interested in contributing, please contact @GeoffreyChen777
</p>
<p align='center'>
<a href='https://paperlib.app/en/'>Webpage</a> | <a href='https://paperlib.app/en/download.html'>Download</a> | <a href='https://paperlib.app/en/doc/getting-started.html'>Quick Start</a> | <a href='https://github.com/users/Future-Scholars/projects/1/views/1'>Roadmap</a>
</p>

![](./assets/ui.png)

## Try 3.0 Beta?

Over the past few months, all the source code of Paperlib has been refactored to support an extensible structure.

Currently, the entire development work has been completed, and most of the bugs have been fixed. Therefore, I would like to invite you to participate in testing, including the exciting development of extensions.

Compared to Paperlib 2.x, in 3.0.0-beta.1, we have:

- Introduced an extension system.
- Moved all metadata scrapers and paper downloaders to corresponding extensions.
- Replaced the original search box with a new command panel, working with extensions to achieve more advanced functionality.
- In response to user feedback, added support for creating new empty tags and folders in the sidebar.
- Fixed some bugs.
- Welcome any users to report bugs you may encounter on Github or at here and encourage extension developers to publish your extension.

The download link and the extension development documents can be found on our [website](https://paperlib.app/en/).

## Introduction

Paperlib is an open source reference manager designed to improve your citing experience by addressing some of the common painpoints found in other software, in particular Zotero and Mendely.

### Main Features

- Rich variety of scrapers to collect metadata for several disciplines
- Fulltext and advanced search.
- Rating, flag, tag, folder and markdown/plain text note.
- RSS feed subscription to follow the newest publications on your research topic.
- Locate and download PDF files from the web.
- macOS and MS Word Plug-ins for inserting citations
- Cloud sync
- Supports macOS, Linux, and Windows.
- Beautiful and clean UI.

### Scrapers

Currently, Paperlib uses the following scrapers (more to come):

- [x] **General**
  - [x] arXiv
  - [x] doi.org
  - [x] Semantic Scholar
  - [x] Crossref
  - [x] Google Scholar
  - [x] Springer
  - [x] Elseivier Scopus
- [x] **Computer Science and Electronic Engineering**
  - [x] openreview.net
  - [x] IEEE
  - [x] DBLP
  - [x] Paper with Code (scrape available in the code repository)
- [x] **Earth Science**
- [x] **Physics**
  - [x] NASA Astrophysics Data System
  - [x] SPIE: Inte. Society for Optics and Photonics
- [ ] **Chemistry**
  - [x] ChemRxiv
- [ ] **Biology**

  - [x] BioRxiv / MedRxiv

## About this project

Conference papers are a big part of computer science research. Without DOI, ISBN, metadata of a lot of conference papers are hard to look up (e.g., NIPS, ICLR etc.). When I cite a publication in a draft paper, I need to manually search the publication information of it in Google Scholar or DBLP over and over again.

**Why not Zotero or Mendely?**

- The scraping capabilities of these tools are limited to what's on the page.

- Outdated UI and bloated features
- Expensive licenses

## Download and Install

<a href="https://paperlib.app/en/download.html" style="font-size: 16px"> » Download Here « </a>

### Windows

⚠️ You may notice that a warning shows when you install Paperlib on Windows. The reason is that there is no code signing in Paperlib because it is so expensive. The source code of Paperlib can be found in the electron branch. It won't hurt your PC and will never collect any personal information. Please make sure you are using HTTPS and our official webpage or Github to download the installer. When you install `latest.exe`, in the "Windows protected your PC" window, please click `More info` and `Run anyway`.

### macOS

⚠️ You may need to click the `preference` - `Security & Privacy` - `run anyway`.

### Linux

See [here](https://paperlib.app/en/download-linux.html).

## Quick Start

[Introduction (EN)](https://paperlib.app/en/doc/getting-started.html)  
[Introduction (CN)](https://paperlib.app/cn/doc/getting-started.html)

## Donate

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

<a href="https://www.buymeacoffee.com/geoffreychen777" target="_blank"><img src="./assets/wechat.png" alt="Buy Me A Coffee" height="174" width="174"></a>

## Sponsors

### Apple Silicon Build

<img src="https://user-images.githubusercontent.com/14183213/179353324-42ee9831-68a8-4816-97f5-cc7be7189ce8.png" style="width: 160px"/>

## Contribute to Paperlib

📣 **Seeking contributors** 📣

If you are interested in contributing, please contact @GeoffreyChen777

### Metadata Scrapers

My research topic is computer vision, which is only one piece of the puzzle of computer science. I tried to contact some friends to provide information about the paper metadata database in different disciplines. However, However, it does not cover all disciplines. If the [builtin metadata scrapers](https://github.com/Future-Scholars/paperlib/tree/master/app/repositories/scraper-repository/scrapers) are not suitable for your research, feel free to open an issue or a pull request.

### Feature Requests

For feature requests please create an issue

## License

[GPL-3.0 License](./LICENSE)

import { DirectedGraph } from "graphology";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { CategorizerType } from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperSmartFilterType } from "@/models/smart-filter";
import { ICategorizerCollection } from "@/repositories/db-repository/categorizer-repository";
import {
  IPaperSmartFilterCollection,
  IPaperSmartFilterObject,
} from "@/repositories/db-repository/smartfilter-repository";

export const IQuerySentenceService = createDecorator("querySentenceService");

export class QuerySentenceService {
  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {}

  /**
   * Create a DAG from a list of Categorizers or PaperSmartFilters.
   * @param data - The data to create the DAG from.
   * @returns
   */
  @errorcatching(
    "Failed to create a querySentence graph.",
    true,
    "QuerySentenceService",
    {}
  )
  parseDAG<T extends PaperSmartFilterType | CategorizerType>(
    data: T extends PaperSmartFilterType
      ? IPaperSmartFilterCollection
      : ICategorizerCollection,
    type: T,
    linkedFolderName?: string
  ): DirectedGraph {
    const graph = new DirectedGraph();

    for (const obj of data) {
      const node = {};
      node["_id"] = obj._id;
      node["name"] = obj.name;
      node["color"] = obj.color;
      node["count"] = obj["count"] || -1;
      node["type"] = type;
      node["icon"] = {
        [CategorizerType.PaperTag]: "tag",
        [CategorizerType.PaperFolder]: "folder",
        [PaperSmartFilterType.smartfilter]: "funnel",
      }[type];

      if (type === CategorizerType.PaperTag) {
        node["query"] = `tags.name == "${obj.name}"`;
      } else if (type === CategorizerType.PaperFolder) {
        node["query"] = `folders.name == "${obj.name}"`;
        if (obj.name === linkedFolderName) {
          node["icon"] = "folder-link";
        }
      } else if (type === PaperSmartFilterType.smartfilter) {
        node["query"] = (obj as IPaperSmartFilterObject).filter;
      }
      graph.addNode(`${obj._id}`, node);
    }

    data.forEach((obj) => {
      obj.children.forEach((child) => {
        graph.addEdge(`${obj._id}`, `${child._id}`);
      });
    });

    return graph;
  }

  /**
   * Create a View Tree from a list of Categorizers or PaperSmartFilters.
   * @param data - The data to create the View Tree from.
   * @returns
   */
  @errorcatching(
    "Failed to create a View Tree from a querySentence graph.",
    true,
    "QuerySentenceService",
    {}
  )
  parseViewTree(
    data: ICategorizerCollection | IPaperSmartFilterCollection,
    type: CategorizerType | PaperSmartFilterType,
    sortBy: string,
    sortOrder: string,
    linkedFolderName?: string
  ): ViewTreeNode {
    if (data.length === 0) {
      return {
        _id: "",
        name: "undefined",
        query: "",
        type: PaperSmartFilterType.smartfilter,
        color: "",
        icon: "funnel",
        count: -1,
        children: [],
      };
    }

    const graph = this.parseDAG(data, type, linkedFolderName);

    let rootID: string | undefined;

    graph.forEachNode((node) => {
      if (graph.inDegree(node) === 0) {
        rootID = node;
      }
    });

    if (rootID === undefined) {
      throw new Error("Invalid query graph, no root node found.");
    }

    const { viewTree } = this._createViewTree(
      this._DAG2Tree(graph, rootID),
      `0-${rootID}`
    );

    // Sort the view tree
    this._sortViewTree(viewTree, sortBy, sortOrder);

    return viewTree;
  }

  private _DAG2Tree(
    graph: DirectedGraph,
    nodeID: string,
    parentID?: string,
    level = 0,
    tree?: DirectedGraph
  ) {
    if (!tree) {
      tree = new DirectedGraph();
    }

    const nodeData = graph.getNodeAttributes(nodeID);
    nodeData["level"] = level;
    tree.addNode(`${level}-${nodeID}`, nodeData);
    if (parentID) {
      tree.addEdge(`${level - 1}-${parentID}`, `${level}-${nodeID}`);
    }

    const lowLevelNodes = graph.outNeighbors(nodeID);
    lowLevelNodes.map((lowLevelNode) => {
      this._DAG2Tree(graph, lowLevelNode, nodeID, level + 1, tree);
    });

    return tree;
  }

  private _createViewTree(tree: DirectedGraph, nodeID: string) {
    const nodeData = tree.getNodeAttributes(nodeID);
    const query: string[] = [];
    const viewTree: ViewTreeNode = {
      _id: nodeData._id,
      name: nodeData.name,
      query: "",
      type: nodeData.type,
      color: nodeData.color,
      icon: nodeData.icon,
      count: nodeData.count || -1,
      children: [],
    };

    query.push(nodeData.query);

    // Collect parent query
    if (nodeData.type === PaperSmartFilterType.smartfilter) {
      const outEdgeNodeIDs = tree.inNeighbors(nodeID);
      if (outEdgeNodeIDs.length === 1) {
        const parentQuery = tree.getNodeAttribute(outEdgeNodeIDs[0], "query");
        query.push(parentQuery);
      } else if (outEdgeNodeIDs.length === 0) {
        // Do nothing
      } else {
        throw new Error("Invalid query tree");
      }
    }

    const queryStr = query
      .filter(
        (q) =>
          q !== "" &&
          q !== "true" &&
          q !== `tags.name == "Tags"` &&
          q !== `folders.name == "Folders"` &&
          q !== `smartfilters.name == "SmartFilters"`
      )
      .join(" AND ");

    tree.setNodeAttribute(nodeID, "query", queryStr);

    // Update view tree
    viewTree["query"] = queryStr;

    // Updaste tree for all children
    const lowLevelNodeIDs = tree.outNeighbors(nodeID);
    let updatedTree = tree;
    lowLevelNodeIDs.forEach((lowLevelNodeID) => {
      let updated = this._createViewTree(updatedTree || tree, lowLevelNodeID);
      updatedTree = updated.updatedTree;
      viewTree["children"].push(updated.viewTree);
    });

    return { updatedTree, viewTree };
  }

  private _sortViewTree(
    viewTree: ViewTreeNode,
    sortBy: string,
    sortOrder: string
  ) {
    viewTree.children.sort((a: ViewTreeNode, b: ViewTreeNode) => {
      if (sortOrder === "asce") {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });
    viewTree.children.forEach((child) => {
      this._sortViewTree(child, sortBy, sortOrder);
    });
  }
}

export interface ViewTreeNode {
  _id: OID;
  name: string;
  query: string;
  color: string;
  type: CategorizerType | PaperSmartFilterType;
  count: number;
  icon: "tag" | "folder" | "folder-link" | "funnel";
  children: ViewTreeNode[];
}

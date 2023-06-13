import { defineStore } from "pinia";

export interface ILogState {
  infoLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  warnLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  errorLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  progressLogMessage: {
    id: string;
    msg: string;
    value: number;
  };
}

export const defineLogState = defineStore("logState", {
  state: (): ILogState => {
    return {
      infoLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      warnLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      errorLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      progressLogMessage: {
        id: "",
        msg: "",
        value: 0,
      },
    };
  },
});

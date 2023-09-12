import { actions as scriptResultActions } from "../scriptresult/slice";

import reducers from "./slice";

import {
  nodeScriptResultState as nodeScriptResultStateFactory,
  scriptResult as scriptResultFactory,
} from "testing/factories";

describe("nodescriptresult reducer", () => {
  it("reduces getByNodeIdSuccess", () => {
    const nodeScriptResultState = nodeScriptResultStateFactory();

    const scriptResults = [
      scriptResultFactory({ id: 1 }),
      scriptResultFactory({ id: 2 }),
    ];

    expect(
      reducers(
        nodeScriptResultState,
        scriptResultActions.getByNodeIdSuccess("abc123", scriptResults)
      )
    ).toEqual({
      items: {
        abc123: [1, 2],
      },
    });
  });
});

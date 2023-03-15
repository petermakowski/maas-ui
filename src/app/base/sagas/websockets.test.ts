import { eventChannel } from "redux-saga";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { call, put, take } from "redux-saga/effects";

import type {
  WebSocketResponseNotify,
  WebSocketResponseResult,
} from "../../../websocket-client";
import WebSocketClient, {
  WebSocketMessageType,
  WebSocketResponseType,
} from "../../../websocket-client";

import type { WebSocketChannel } from "./websockets";
import {
  createConnection,
  handleFileContextRequest,
  handleWebSocket,
  handleNextActions,
  handleNotifyMessage,
  handlePolling,
  nextActions,
  pollAction,
  sendMessage,
  storeFileContextActions,
  watchMessages,
  watchWebSockets,
  handleUnsubscribe,
} from "./websockets";

import { actions as machineActions } from "app/store/machine";
import { getCookie } from "app/utils";
import {
  machineState as machineStateFactory,
  rootState as rootStateFactory,
  machineStateList as machineStateListFactory,
  machineStateListGroup as machineStateListGroupFactory,
} from "testing/factories";

jest.mock("app/utils", () => ({
  ...jest.requireActual("app/utils"),
  getCookie: jest.fn(),
}));

describe("websocket sagas", () => {
  let socketChannel: WebSocketChannel;
  let socketClient: WebSocketClient;
  const getCookieMock = getCookie as jest.Mock;

  beforeEach(() => {
    getCookieMock.mockImplementation(() => "abc123");
    socketClient = new WebSocketClient();
    socketClient.connect();
    if (socketClient.socket) {
      socketClient.socket.onerror = jest.fn();
    }
    socketChannel = eventChannel(() => () => null);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("connects to a WebSocket", () => {
    return expectSaga(watchWebSockets, socketClient)
      .provide([[call(createConnection, socketClient), {}]])
      .take("status/websocketConnect")
      .put({
        type: "status/websocketConnected",
      })
      .dispatch({
        type: "status/websocketConnect",
      })
      .run();
  });

  it("raises an error if no csrftoken exists", () => {
    const error = new Error(
      "No csrftoken found, please ensure you are logged into MAAS."
    );
    socketClient.socket = null;
    socketClient.buildURL = jest.fn(() => {
      throw error;
    });
    return expectSaga(watchWebSockets, socketClient)
      .take("status/websocketConnect")
      .put({
        type: "status/websocketError",
        error: true,
        payload: error.message,
      })
      .dispatch({
        type: "status/websocketConnect",
      })
      .run();
  });

  it("can create a WebSocket connection", () => {
    expect.assertions(1);
    const socket = createConnection(socketClient);
    if (socketClient.socket?.onopen) {
      socketClient.socket.onopen({} as Event);
    }
    return expect(socket).resolves.toEqual(socketClient);
  });

  it("can watch for WebSocket messages", () => {
    const channel = watchMessages(socketClient);
    let response;
    channel.take((val) => (response = val));
    if (socketClient.socket?.onmessage) {
      socketClient.socket.onmessage({
        data: '{"message": "secret"}',
      } as MessageEvent);
    }
    expect(response).toEqual({
      data: '{"message": "secret"}',
    });
  });

  it("can send a WebSocket message", () => {
    const action = {
      type: "test/action",
      meta: {
        model: "test",
        method: "method",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: { foo: "bar" },
      },
    };
    const saga = sendMessage(socketClient, action);
    expect(saga.next().value).toEqual(
      put({ meta: { item: { foo: "bar" } }, type: "test/actionStart" })
    );
    expect(saga.next().value).toEqual(
      call([socketClient, socketClient.send], action, {
        method: "test.method",
        type: WebSocketMessageType.REQUEST,
        params: { foo: "bar" },
      })
    );
  });

  it("can send a WebSocket message with a request id", () => {
    const action = {
      type: "test/action",
      meta: {
        model: "test",
        method: "method",
        callId: "123456",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: { foo: "bar" },
      },
    };
    const saga = sendMessage(socketClient, action);
    expect(saga.next().value).toEqual(
      put({
        meta: { item: { foo: "bar" }, callId: "123456" },
        type: "test/actionStart",
      })
    );
    expect(saga.next().value).toEqual(
      call([socketClient, socketClient.send], action, {
        method: "test.method",
        type: WebSocketMessageType.REQUEST,
        params: { foo: "bar" },
      })
    );
  });

  it("can store a next action when sending a WebSocket message", () => {
    const action = {
      type: "test/action",
      meta: {
        model: "test",
        method: "method",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: { foo: "bar" },
      },
    };
    const nextActionCreators = [jest.fn()];
    return expectSaga(sendMessage, socketClient, action, nextActionCreators)
      .provide([[matchers.call.fn(socketClient.send), 808]])
      .call([nextActions, nextActions.set], 808, nextActionCreators)
      .run();
  });

  it("continues if data has already been fetched for list methods", () => {
    const action = {
      type: "test/fetch",
      meta: {
        model: "test",
        method: "test.list",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: {},
      },
    };
    const previous = sendMessage(socketClient, action);
    previous.next();
    const saga = sendMessage(socketClient, action);
    // The saga should have finished.
    expect(saga.next().done).toBe(true);
  });

  it("continues if data has already been fetched for methods with cache", () => {
    const action = {
      type: "test/fetch",
      meta: {
        cache: true,
        model: "test",
        method: "test.getAll",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: {},
      },
    };
    const previous = sendMessage(socketClient, action);
    previous.next();
    const saga = sendMessage(socketClient, action);
    // The saga should have finished.
    expect(saga.next().done).toBe(true);
  });

  it("fetches list methods if no-cache is set", () => {
    const action = {
      type: "test/fetch",
      meta: {
        model: "test",
        method: "test.list",
        type: WebSocketMessageType.REQUEST,
        nocache: true,
      },
      payload: {
        params: {},
      },
    };
    const previous = sendMessage(socketClient, action);
    previous.next();
    const saga = sendMessage(socketClient, action);
    // The saga should not have finished.
    expect(saga.next().done).toBe(false);
  });

  it("can handle dispatching for each param in an array", () => {
    const action = {
      type: "test/action",
      meta: {
        dispatchMultiple: true,
        model: "test",
        method: "method",
        type: WebSocketMessageType.REQUEST,
      },
      payload: {
        params: [
          { name: "foo", value: "bar" },
          { name: "baz", value: "qux" },
        ],
      },
    };
    const saga = sendMessage(socketClient, action);
    expect(saga.next().value).toEqual(
      put({
        meta: {
          item: [
            { name: "foo", value: "bar" },
            { name: "baz", value: "qux" },
          ],
        },
        type: "test/actionStart",
      })
    );

    expect(saga.next().value).toEqual(
      call([socketClient, socketClient.send], action, {
        method: "test.method",
        type: WebSocketMessageType.REQUEST,
        params: { name: "foo", value: "bar" },
      })
    );
    expect(saga.next().value).toEqual(take("test/actionNotify"));

    expect(saga.next().value).toEqual(
      call([socketClient, socketClient.send], action, {
        method: "test.method",
        type: WebSocketMessageType.REQUEST,
        params: { name: "baz", value: "qux" },
      })
    );
    expect(saga.next().value).toEqual(take("test/actionNotify"));
  });

  it("can handle errors when sending a WebSocket message", () => {
    const saga = sendMessage(socketClient, {
      type: "test/action",
      meta: {
        model: "test",
        method: "method",
      },
      payload: {
        params: { foo: "bar" },
      },
    });
    saga.next();
    saga.next();
    expect(saga.throw("error!").value).toEqual(
      put({
        error: true,
        meta: { item: { foo: "bar" } },
        type: "test/actionError",
        payload: "error!",
      })
    );
  });

  it("can handle a WebSocket response message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(
      saga.next({
        data: JSON.stringify({ request_id: 99, result: { response: "here" } }),
      }).value
    ).toStrictEqual(call([socketClient, socketClient.getRequest], 99));
    saga.next({
      type: "test/action",
      payload: { id: 808 },
      meta: { identifier: 123 },
    });
    expect(saga.next(false).value).toEqual(
      put({
        meta: { item: { id: 808 }, identifier: 123 },
        type: "test/actionSuccess",
        payload: { response: "here" },
      })
    );
  });

  it("can handle a WebSocket response message with a request id", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(
      saga.next({
        data: JSON.stringify({ request_id: 99, result: { response: "here" } }),
      }).value
    ).toStrictEqual(call([socketClient, socketClient.getRequest], 99));
    saga.next({
      type: "test/action",
      payload: { id: 808 },
      meta: { identifier: 123, callId: "456" },
    });
    expect(saga.next(false).value).toEqual(
      put({
        meta: { item: { id: 808 }, identifier: 123, callId: "456" },
        type: "test/actionSuccess",
        payload: { response: "here" },
      })
    );
  });

  it("can dispatch a next action", () => {
    const response: WebSocketResponseResult = {
      rtype: WebSocketResponseType.SUCCESS,
      type: WebSocketMessageType.RESPONSE,
      request_id: 99,
      result: { id: 808 },
    };
    const action = { type: "NEXT_ACTION" };
    const actionCreator = jest.fn(() => action);
    return expectSaga(handleNextActions, response)
      .provide([
        [call([nextActions, nextActions.get], 99), [actionCreator]],
        [call([nextActions, nextActions.delete], 99), null],
      ])
      .call(actionCreator, response.result)
      .put(action)
      .run();
  });

  it("can handle a WebSocket error response message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(
      saga.next({
        data: JSON.stringify({
          request_id: 99,
          error: '{"Message": "catastrophic failure"}',
        }),
      }).value
    ).toEqual(call([socketClient, socketClient.getRequest], 99));
    saga.next({ type: "test/action", payload: { id: 808 } });
    expect(saga.next(false).value).toEqual(
      put({
        error: true,
        meta: {
          item: { id: 808 },
        },
        payload: { Message: "catastrophic failure" },
        type: "test/actionError",
      })
    );
  });

  it("can handle a WebSocket error message that is not JSON", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(
      saga.next({
        data: JSON.stringify({
          request_id: 99,
          error: '("catastrophic failure")',
        }),
      }).value
    ).toEqual(call([socketClient, socketClient.getRequest], 99));
    saga.next({ type: "test/action", payload: { id: 808 } });
    expect(saga.next(false).value).toEqual(
      put({
        error: true,
        meta: {
          item: { id: 808 },
        },
        payload: '("catastrophic failure")',
        type: "test/actionError",
      })
    );
  });

  it("can handle a WebSocket notify message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    const response: WebSocketResponseNotify = {
      type: WebSocketMessageType.NOTIFY,
      name: "config",
      action: "update",
      data: { name: "foo", value: "bar" },
    };
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(saga.next({ data: JSON.stringify(response) }).value).toEqual(
      call(handleNotifyMessage, response)
    );
    // yield no further, take a new message
    expect(saga.next().value).toEqual(take(socketChannel));
  });

  it("can handle a WebSocket close message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(saga.next({ type: "close" }).value).toEqual(
      put({ type: "status/websocketDisconnected" })
    );
  });

  it("can handle a WebSocket error message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(saga.next({ type: "error", message: "Timeout" }).value).toEqual(
      put({ type: "status/websocketError", error: true, payload: "Timeout" })
    );
  });

  it("can handle a WebSocket open message", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    expect(saga.next().value).toEqual(take(socketChannel));
    expect(saga.next({ type: "open" }).value).toEqual(
      put({ type: "status/websocketConnected" })
    );
  });

  it("can store a file context action when sending a WebSocket message", () => {
    const action = {
      type: "test/action",
      meta: {
        fileContextKey: "file1",
        method: "method",
        model: "test",
        type: WebSocketMessageType.REQUEST,
        useFileContext: true,
      },
      payload: {
        params: { system_id: "abc123" },
      },
    };
    return expectSaga(sendMessage, socketClient, action)
      .provide([[matchers.call.fn(socketClient.send), "abc123"]])
      .call(storeFileContextActions, action, ["abc123"])
      .run();
  });

  it("can handle a file response", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    saga.next();
    const response: WebSocketResponseResult<string> = {
      request_id: 99,
      rtype: WebSocketResponseType.SUCCESS,
      type: WebSocketMessageType.RESPONSE,
      result: "file contents",
    };
    saga.next({ data: JSON.stringify(response) });
    expect(saga.next().value).toEqual(call(handleFileContextRequest, response));
  });

  it("file responses do not dispatch the payload", () => {
    const saga = handleWebSocket(socketChannel, socketClient);
    saga.next();
    saga.next({
      data: JSON.stringify({
        request_id: 99,
        result: "file contents",
      }),
    });
    saga.next({
      type: "test/action",
      meta: {
        fileContextKey: "file1",
        method: "method",
        model: "test",
        type: WebSocketMessageType.REQUEST,
        useFileContext: true,
      },
      payload: {
        params: { system_id: "abc123" },
      },
    });
    expect(saga.next(true).value).toEqual(
      put({
        meta: { item: { system_id: "abc123" } },
        type: "test/actionSuccess",
        payload: null,
      })
    );
  });

  it("can unsubscribe from unused machines", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          123456: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["abc123"],
              }),
            ],
          }),
        },
      }),
    });
    return expectSaga(
      handleUnsubscribe,
      machineActions.cleanupRequest("123456")
    )
      .withState(state)
      .put(machineActions.unsubscribe(["abc123"]))
      .put(machineActions.removeRequest("123456"))
      .run();
  });

  it("removes request when machines are in use", () => {
    const state = rootStateFactory({
      machine: machineStateFactory({
        lists: {
          123456: machineStateListFactory({
            groups: [
              machineStateListGroupFactory({
                items: ["abc123"],
              }),
            ],
          }),
        },
      }),
    });
    return expectSaga(
      handleUnsubscribe,
      machineActions.cleanupRequest("123456")
    )
      .withState(state)
      .put(machineActions.removeRequest("123456"))
      .run();
  });

  describe("polling", () => {
    it("can start polling", () => {
      const action = {
        type: "testAction",
        meta: {
          model: "test",
          method: "method",
          poll: true,
        },
        payload: {
          params: {},
        },
      };
      return expectSaga(handlePolling, action)
        .put({
          type: "testActionPollingStarted",
          meta: { pollId: undefined },
        })
        .run();
    });

    it("can stop polling", () => {
      const action = {
        type: "testAction",
        meta: {
          model: "test",
          method: "method",
          pollStop: true,
        },
        payload: {
          params: {},
        },
      };
      return expectSaga(handlePolling, action)
        .put({
          type: "testActionPollingStopped",
          meta: { pollId: undefined },
        })
        .dispatch({
          type: "testAction",
          meta: {
            model: "test",
            method: "method",
            pollStop: true,
          },
          payload: null,
        })
        .run();
    });

    it("can start polling with an id", () => {
      const action = {
        type: "testAction",
        meta: {
          model: "test",
          method: "method",
          poll: true,
          pollId: "poll123",
        },
        payload: {
          params: {},
        },
      };
      return expectSaga(handlePolling, action)
        .put({
          type: "testActionPollingStarted",
          meta: { pollId: "poll123" },
        })
        .run();
    });

    it("can stop polling with an id", () => {
      const action = {
        type: "testAction",
        meta: {
          model: "test",
          method: "method",
          pollStop: true,
          pollId: "poll123",
        },
        payload: {
          params: {},
        },
      };
      return expectSaga(handlePolling, action)
        .put({
          type: "testActionPollingStopped",
          meta: { pollId: "poll123" },
        })
        .dispatch({
          type: "testAction",
          meta: {
            model: "test",
            method: "method",
            pollStop: true,
            pollId: "poll123",
          },
        })
        .run();
    });

    it("sends the action after the interval", () => {
      const action = {
        type: "testAction",
        meta: {
          model: "test",
          method: "method",
          poll: true,
        },
        payload: {
          params: {},
        },
      };
      const saga = pollAction(action);
      // Skip the delay:
      saga.next();
      expect(saga.next(action).value).toEqual(put(action));
    });
  });
});

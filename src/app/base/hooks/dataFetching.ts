import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import type { AnyAction } from "redux";

import type actions from "app/store/actions";
import { fetchActions } from "app/store/actions";
import statusSelectors from "app/store/status/selectors";
/**
 * A hook to run a set of actions once on mount and again when the websocket
 * reconnects.
 * @param {Array<() => AnyAction>} actions - The actions to run.
 */
export const useFetchActions = (actions: (() => AnyAction)[]) => {
  const dispatch = useDispatch();
  const reconnectionCount = useSelector(statusSelectors.reconnectionCount);

  useEffect(() => {
    actions.forEach((action) => {
      dispatch(action());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, reconnectionCount]);
};

/**
 * A simple hook allowing to run data fetching actions in style of react-query
 * runs each query once on mount and again when the websocket reconnects.
 * @param {Array<() => AnyAction>} actions - The actions to run.
 */
type ReduxStoreSlice = keyof typeof actions;
type ReduxStoreSliceActions = {
  [K in ReduxStoreSlice]: (typeof actions)[K];
};
type SliceKey = keyof ReduxStoreSliceActions;
type ReduxStoreSliceActionKeys = {
  [K in ReduxStoreSlice]: keyof ReduxStoreSliceActions[K];
};
type WebsocketQueryKey = `${SliceKey}.${keyof ReduxStoreSliceActionKeys}`;

export const useWebsocketQuery = ({
  // query key consists of slice name and action name
  // e.g. ["pod.fetch", "machine.fetch"]
  queryKey,
}: {
  queryKey: WebsocketQueryKey[];
}) => {
  const dispatch = useDispatch();
  const reconnectionCount = useSelector(statusSelectors.reconnectionCount);

  useEffect(() => {
    queryKey.forEach((queryKey) => {
      // if there's a period in query key, it's a nested slice
      // and we need to dispatch the parent slice's fetch action
      if (queryKey.includes(".")) {
        const [parentSlice, action] = queryKey.split(".");
        const sliceActions =
          parentSlice in fetchActions
            ? fetchActions[parentSlice as keyof typeof fetchActions]
            : null;
        if (sliceActions && action in sliceActions && sliceActions[action]) {
          dispatch(sliceActions[action]());
        } else {
          throw new Error(
            `useWebsocketQuery: ${queryKey} slice does not have fetch action`
          );
        }
        return;
      }
      const sliceActions = fetchActions[queryKey];
      if ("fetch" in sliceActions && sliceActions.fetch) {
        dispatch(sliceActions.fetch());
      } else {
        throw new Error(
          `useWebsocketQuery: ${queryKey} slice does not have fetch action`
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, reconnectionCount]);
};

import { useEffect, useState } from "react";

import DeviceFilterAccordion from "./DeviceFilterAccordion";

import DebounceSearchBox from "app/base/components/DebounceSearchBox";
import type { SetSearchFilter } from "app/base/types";

type Props = {
  filter: string;
  setFilter: SetSearchFilter;
};

const DeviceListControls = ({ filter, setFilter }: Props): JSX.Element => {
  const [searchText, setSearchText] = useState(filter);

  useEffect(() => {
    // If the filters change then update the search input text.
    setSearchText(filter);
  }, [filter]);

  return (
    <>
      <DeviceFilterAccordion
        searchText={searchText}
        setSearchText={setFilter}
      />
      <DebounceSearchBox
        onDebounced={(debouncedText) => setFilter(debouncedText)}
        searchText={searchText}
        setSearchText={setSearchText}
      />
    </>
  );
};

export default DeviceListControls;

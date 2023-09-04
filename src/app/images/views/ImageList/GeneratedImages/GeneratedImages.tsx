import { Strip } from "@canonical/react-components";
import { useSelector } from "react-redux";

import ImagesTable from "@/app/images/components/ImagesTable";
import type { ImageValue } from "@/app/images/types";
import bootResourceSelectors from "@/app/store/bootresource/selectors";
import { splitResourceName } from "@/app/store/bootresource/utils";

const GeneratedImages = (): JSX.Element | null => {
  const generatedResources = useSelector(
    bootResourceSelectors.generatedResources
  );

  if (generatedResources.length === 0) {
    return null;
  }

  const images = generatedResources.reduce<ImageValue[]>((images, resource) => {
    const { os, release } = splitResourceName(resource.name);
    images.push({
      arch: resource.arch,
      os,
      release,
      resourceId: resource.id,
      title: resource.title,
    });
    return images;
  }, []);

  return (
    <>
      <hr />
      <Strip shallow>
        <h4>Generated images</h4>
        <ImagesTable images={images} resources={generatedResources} />
      </Strip>
    </>
  );
};

export default GeneratedImages;

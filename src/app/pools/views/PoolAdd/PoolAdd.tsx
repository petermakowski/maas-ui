import PoolForm from "@/app/pools/components/PoolForm";

export enum Label {
  Title = "Add pool form",
}

export const PoolAdd = (): JSX.Element => {
  return <PoolForm aria-label={Label.Title} />;
};

export default PoolAdd;

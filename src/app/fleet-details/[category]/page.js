import FleetDetails from "../../fleet-details/FleetDetails";

export async function generateStaticParams() {
  return [
    { category: "sedan" },
    { category: "suv" },
    { category: "mpv" },
    { category: "van" },
    { category: "pickup" },
  ];
}

export default function FleetCategoryPage({ params }) {
  const { category } = params;

  return <FleetDetails category={category} />;
}

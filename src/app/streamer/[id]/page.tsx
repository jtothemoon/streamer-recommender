import StreamerDetail from "./StreamerDetail";

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  return <StreamerDetail id={params.id} />;
}
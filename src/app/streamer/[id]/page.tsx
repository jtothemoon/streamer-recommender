import StreamerDetail from "./StreamerDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <StreamerDetail id={id} />;
}

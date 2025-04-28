import StreamerDetail from "./StreamerDetail";

export default function Page({ params }: { params: { id: string } }) {
  return <StreamerDetail id={params.id} />;
}

import LoadingSpinner from './LoadingSpinner';

export default function PageLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <LoadingSpinner />
    </div>
  );
}
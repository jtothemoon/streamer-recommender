export default function LoadingSpinner({ text = '로딩 중...', size = 'default' }: { text?: string, size?: 'small' | 'default' | 'large' }) {
    const getSize = () => {
      switch (size) {
        case 'small': return 'w-3 h-3';
        case 'large': return 'w-5 h-5';
        default: return 'w-4 h-4';
      }
    };
  
    return (
      <div className="flex justify-center items-center gap-2">
        <div className={`${getSize()} border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin`} />
        {text && <span>{text}</span>}
      </div>
    );
  }
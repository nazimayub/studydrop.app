import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.svg" alt="opendesk logo" width={120} height={30} />
    </div>
  );
}

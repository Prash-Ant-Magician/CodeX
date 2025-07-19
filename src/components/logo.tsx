import { Code2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Code2 className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold text-foreground font-headline">CodeLeap</h1>
    </div>
  );
}

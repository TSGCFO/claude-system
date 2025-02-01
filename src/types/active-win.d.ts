declare module 'active-win' {
  interface WindowInfo {
    title: string;
    id: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    owner: {
      name: string;
      processId: number;
      path: string;
    };
    memoryUsage: number;
  }

  export default function activeWin(): Promise<WindowInfo | undefined>;
}
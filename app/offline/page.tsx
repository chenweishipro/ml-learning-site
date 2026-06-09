import { WifiOff } from "lucide-react";
import { OfflineActions } from "./offline-actions";

export const metadata = {
  title: "离线 / Offline",
  description: "网络连接失败 / No network connection",
};

export default function OfflinePage() {
  return (
    <div className="container max-w-md py-20 text-center">
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <WifiOff className="h-10 w-10 text-neutral-400" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        没有网络连接
      </h1>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        看来你现在离线了。可以浏览已访问过的页面, 或者检查网络后刷新。
      </p>
      <OfflineActions />
      <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-3 text-left text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        💡 <strong>提示</strong>: 安装本应用到桌面后, 部分已访问的课程页面可以离线打开。
        <br />
        Chrome: 地址栏右侧的「安装」按钮
        <br />
        Safari iOS: 分享 → 添加到主屏幕
      </div>
    </div>
  );
}

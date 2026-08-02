"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const t = useTranslations("nav");
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-wood-900 dark:text-cream-50">{t("settings")}</h1>

      <Card>
        <CardHeader title="Business profile" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Owner name</label>
            <input className="input-field" defaultValue={user?.name ?? ""} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business name</label>
            <input className="input-field" defaultValue={user?.businessName ?? ""} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="input-field" defaultValue={user?.phone ?? ""} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="input-field" defaultValue={user?.email ?? ""} />
          </div>
        </div>
        <Button className="mt-5">Save changes</Button>
      </Card>

      <Card>
        <CardHeader title="Security" />
        <div className="space-y-4">
          <input type="password" className="input-field" placeholder="Current password" />
          <input type="password" className="input-field" placeholder="New password" />
        </div>
        <Button className="mt-5" variant="secondary">
          Change password
        </Button>
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <label className="flex items-center justify-between py-2">
          <span className="text-wood-700 dark:text-cream-100">Low stock alerts</span>
          <input type="checkbox" defaultChecked className="h-5 w-5 accent-forest-600" />
        </label>
        <label className="flex items-center justify-between py-2">
          <span className="text-wood-700 dark:text-cream-100">Order status updates</span>
          <input type="checkbox" defaultChecked className="h-5 w-5 accent-forest-600" />
        </label>
      </Card>
    </div>
  );
}

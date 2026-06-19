"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useTestAlertRule,
  useChannels,
} from "@/hooks/use-api";
import { ALERT_TRIGGERS, NOTIF_CHANNELS } from "@/types";

export default function AlertsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    channelId: "",
    trigger: "NEW_VIDEO",
    notifChannel: "WEBHOOK",
    destination: "",
  });

  const { data: rules = [], isLoading } = useAlertRules();
  const { data: channels = [] } = useChannels();
  const createRule = useCreateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const testRule = useTestAlertRule();

  async function addRule() {
    if (!form.destination.trim()) return;
    await createRule.mutateAsync({
      channelId: form.channelId || null,
      trigger: form.trigger,
      notifChannel: form.notifChannel,
      destination: form.destination,
    });
    setShowAdd(false);
    setForm({
      channelId: "",
      trigger: "NEW_VIDEO",
      notifChannel: "WEBHOOK",
      destination: "",
    });
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {rules.length} alert rules configured
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </motion.div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel (optional)</label>
              <Select
                value={form.channelId}
                onValueChange={(v) => setForm({ ...form, channelId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trigger</label>
              <Select
                value={form.trigger}
                onValueChange={(v) => setForm({ ...form, trigger: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notification Channel
              </label>
              <Select
                value={form.notifChannel}
                onValueChange={(v) => setForm({ ...form, notifChannel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIF_CHANNELS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input
                placeholder="URL / email / webhook"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addRule} disabled={!form.destination.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No alert rules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create rules to get notified when competitors make changes.
              </p>
              <Button className="mt-4" onClick={() => setShowAdd(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Bell
                      className={`h-4 w-4 ${
                        rule.enabled ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {rule.trigger.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {rule.notifChannel}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rule.destination}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={testRule.isPending}
                      onClick={() => testRule.mutate(rule.id)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this alert rule?"))
                          deleteRule.mutate(rule.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

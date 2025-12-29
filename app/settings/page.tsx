'use client';

import { Suspense } from 'react';
import { AddSourceModal } from '@/components/settings/AddSourceModal';
import { ExportModal } from '@/components/settings/ExportModal';
import { ImportModal } from '@/components/settings/ImportModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SourceSettings } from '@/components/settings/SourceSettings';
import { SortSettings } from '@/components/settings/SortSettings';
import { DataSettings } from '@/components/settings/DataSettings';
import { PasswordSettings } from '@/components/settings/PasswordSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useSettingsPage } from './hooks/useSettingsPage';

export default function SettingsPage() {
  const {
    sources,
    sortBy,
    passwordAccess,
    accessPasswords,
    envPasswordSet,
    realtimeLatency,
    searchDisplayMode,
    isAddModalOpen,
    isExportModalOpen,
    isImportModalOpen,
    isResetDialogOpen,
    isRestoreDefaultsDialogOpen,
    setIsAddModalOpen,
    setIsExportModalOpen,
    setIsImportModalOpen,
    setIsResetDialogOpen,
    setIsRestoreDefaultsDialogOpen,
    handleSourcesChange,
    handleAddSource,
    handleSortChange,
    handlePasswordToggle,
    handleAddPassword,
    handleRemovePassword,
    handleExport,
    handleImportFile,
    handleImportLink,
    subscriptions,
    handleAddSubscription,
    handleRemoveSubscription,
    handleRefreshSubscription,
    handleRestoreDefaults,
    handleResetAll,
    editingSource,
    handleEditSource,
    setEditingSource,
    handleRealtimeLatencyChange,
    handleSearchDisplayModeChange,
  } = useSettingsPage();

  return (
    <div className="min-h-screen bg-[var(--bg-color)] bg-[image:var(--bg-image)] bg-fixed">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Header */}
        <SettingsHeader />

        {/* Password Settings */}
        <PasswordSettings
          enabled={passwordAccess}
          passwords={accessPasswords}
          envPasswordSet={envPasswordSet}
          onToggle={handlePasswordToggle}
          onAdd={handleAddPassword}
          onRemove={handleRemovePassword}
        />

        {/* Display Settings */}
        <DisplaySettings
          realtimeLatency={realtimeLatency}
          searchDisplayMode={searchDisplayMode}
          onRealtimeLatencyChange={handleRealtimeLatencyChange}
          onSearchDisplayModeChange={handleSearchDisplayModeChange}
        />

        {/* Source Management */}
        <SourceSettings
          sources={sources}
          onSourcesChange={handleSourcesChange}
          onRestoreDefaults={() => setIsRestoreDefaultsDialogOpen(true)}
          onAddSource={() => {
            setEditingSource(null);
            setIsAddModalOpen(true);
          }}
          onEditSource={handleEditSource}
        />

        {/* Sort Options */}
        <SortSettings
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        {/* Data Management */}
        <DataSettings
          onExport={() => setIsExportModalOpen(true)}
          onImport={() => setIsImportModalOpen(true)}
          onReset={() => setIsResetDialogOpen(true)}
        />
      </div>

      {/* Modals */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSource(null);
        }}
        onAdd={handleAddSource}
        existingIds={sources.map(s => s.id)}
        initialValues={editingSource}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportFile={handleImportFile}
        onImportLink={handleImportLink}
        subscriptions={subscriptions}
        onAddSubscription={handleAddSubscription}
        onRemoveSubscription={handleRemoveSubscription}
        onRefreshSubscription={handleRefreshSubscription}
      />

      <ConfirmDialog
        isOpen={isRestoreDefaultsDialogOpen}
        title="恢复默认源"
        message="这将重置所有视频源为默认配置。自定义源将被删除。是否继续？"
        confirmText="恢复"
        cancelText="取消"
        onConfirm={handleRestoreDefaults}
        onCancel={() => setIsRestoreDefaultsDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="清除所有数据"
        message="这将删除所有设置、历史记录、Cookie 和缓存。此操作不可撤销。是否继续？"
        confirmText="清除"
        cancelText="取消"
        onConfirm={handleResetAll}
        onCancel={() => setIsResetDialogOpen(false)}
        dangerous
      />
    </div>
  );
}


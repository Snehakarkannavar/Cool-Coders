import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DatasetOutlined as DatasetIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DriveFileRenameOutline as RenameIcon,
  Search as SearchIcon,
  TableChart as TableIcon,
  CheckCircle as ActiveIcon,
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { useData } from '@/contexts/DataContext';
import { DataTable } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

interface DatasetManagerProps {
  onDatasetSelect?: (datasetId: string) => void;
}

export function DatasetManager({ onDatasetSelect }: DatasetManagerProps) {
  const { dataSources, activeDataSourceId, setActiveDataSource, removeDataSource, updateDataSourceName } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDataset, setViewingDataset] = useState<string | null>(null);
  const [renamingDataset, setRenamingDataset] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingDataset, setDeletingDataset] = useState<string | null>(null);

  const filteredDataSources = dataSources.filter(ds =>
    ds.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDataSources = dataSources.filter(ds => ds.id === activeDataSourceId);
  const totalDatasets = dataSources.length;

  const handleRename = (datasetId: string, currentName: string) => {
    setRenamingDataset(datasetId);
    setNewName(currentName);
  };

  const handleDelete = (datasetId: string) => {
    setDeletingDataset(datasetId);
  };

  const confirmDelete = () => {
    if (deletingDataset) {
      removeDataSource(deletingDataset);
      setDeletingDataset(null);
    }
  };

  const confirmRename = () => {
    if (renamingDataset && newName.trim()) {
      updateDataSourceName(renamingDataset, newName.trim());
      setRenamingDataset(null);
      setNewName('');
    }
  };

  const handleViewDataset = (datasetId: string) => {
    setViewingDataset(datasetId);
  };

  const getDatasetIcon = (type: string) => {
    switch (type) {
      case 'sql':
        return <StorageIcon className="w-4 h-4 text-blue-600" />;
      case 'mongodb':
        return <StorageIcon className="w-4 h-4 text-green-600" />;
      case 'file':
      default:
        return <TableIcon className="w-4 h-4 text-purple-600" />;
    }
  };

  const getDatasetStatusColor = (datasetId: string) => {
    return datasetId === activeDataSourceId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
  };

  // If viewing a dataset, show the dataset view
  if (viewingDataset) {
    const dataset = dataSources.find(ds => ds.id === viewingDataset);
    if (!dataset) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingDataset(null)}
              className="flex items-center gap-2"
            >
              <ArrowBackIcon className="w-4 h-4" />
              Back to Datasets
            </Button>
            <h2 className="text-xl font-semibold">{dataset.name}</h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              {getDatasetIcon(dataset.type)}
              {dataset.type.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {dataset.data.length} rows • {dataset.columns.length} columns
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <DataTable 
              data={dataset.data} 
              columns={dataset.columns.map(col => ({
                key: col.id,
                title: col.name,
                dataIndex: col.id,
                type: col.type
              }))} 
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <DatasetIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDatasets}</div>
            <p className="text-xs text-muted-foreground">
              {totalDatasets === 0 ? 'No datasets uploaded yet' : 'Uploaded datasets'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Datasets</CardTitle>
            <ActiveIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDataSources.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently selected for analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Types</CardTitle>
            <TableIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(dataSources.map(ds => ds.type)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different data source types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Datasets Section */}
      {activeDataSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ActiveIcon className="w-5 h-5 text-green-600" />
              Active Datasets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeDataSources.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDatasetIcon(dataset.type)}
                    <div>
                      <div className="font-medium">{dataset.name}</div>
                      <div className="text-sm text-gray-500">
                        {dataset.data.length} rows • {dataset.columns.length} columns
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Datasets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Datasets</CardTitle>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataSources.length === 0 ? (
            <div className="text-center py-12">
              <DatasetIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets found</h3>
              <p className="text-gray-500">Upload your first dataset to get started with analysis.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredDataSources.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="group flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => {
                        setActiveDataSource(dataset.id);
                        if (onDatasetSelect) {
                          onDatasetSelect(dataset.id);
                        }
                      }}
                    >
                      {getDatasetIcon(dataset.type)}
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {dataset.name}
                          {dataset.id === activeDataSourceId && (
                            <ActiveIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {dataset.data.length} rows • {dataset.columns.length} columns • {dataset.type}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={dataset.id === activeDataSourceId ? "default" : "secondary"}
                        className={getDatasetStatusColor(dataset.id)}
                      >
                        {dataset.id === activeDataSourceId ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDataset(dataset.id)}
                            className="flex items-center gap-2"
                          >
                            <ViewIcon className="w-4 h-4" />
                            View Data
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRename(dataset.id, dataset.name)}
                            className="flex items-center gap-2"
                          >
                            <RenameIcon className="w-4 h-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActiveDataSource(dataset.id)}
                            className="flex items-center gap-2"
                          >
                            <EditIcon className="w-4 h-4" />
                            Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(dataset.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <DeleteIcon className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      <Dialog open={!!renamingDataset} onOpenChange={() => setRenamingDataset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Dataset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new dataset name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename();
                } else if (e.key === 'Escape') {
                  setRenamingDataset(null);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenamingDataset(null)}>
                Cancel
              </Button>
              <Button onClick={confirmRename}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDataset} onOpenChange={() => setDeletingDataset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dataset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
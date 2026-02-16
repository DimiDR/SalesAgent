'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Database,
  FileText,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Upload,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';

// Types

interface CorpusInfo {
  name: string;
  displayName: string;
  description?: string;
}

interface CorpusStats {
  documentCount: number;
  chunkCount: number;
}

interface DocumentInfo {
  name: string;
  displayName: string;
  status?: 'PENDING' | 'ACTIVE' | 'ERROR';
}

interface SearchResultItem {
  content: string;
  source: string;
  score: number;
  scorePercent: string;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'error';

export default function AdminPage() {
  const { projects } = useStore();

  // Data state
  const [corpora, setCorpora] = useState<CorpusInfo[]>([]);
  const [corpusStats, setCorpusStats] = useState<Record<string, CorpusStats>>({});
  const [corpusDocuments, setCorpusDocuments] = useState<Record<string, DocumentInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedCorpus, setExpandedCorpus] = useState<string | null>(null);
  const [loadingDocuments, setLoadingDocuments] = useState<string | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    type: 'corpus' | 'document';
    corpusName: string;
    documentName?: string;
    displayName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Upload modal state
  const [uploadModal, setUploadModal] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Search test modal state
  const [searchModal, setSearchModal] = useState<string | null>(null);
  const [searchTestQuery, setSearchTestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Extract projectId from corpus name pattern "salesagent-project-{id}"
  const getProjectFromCorpus = useCallback(
    (corpusDisplayName: string) => {
      const match = corpusDisplayName.match(/^salesagent-project-(.+)$/);
      if (!match) return null;
      const projectId = match[1];
      const project = projects.find((p) => p.id === projectId);
      return project ? { id: projectId, name: project.name } : { id: projectId, name: null };
    },
    [projects]
  );

  // Load corpora
  const loadCorpora = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rag/corpus');
      const data = await res.json();
      if (res.status === 503) {
        setCorpora([]);
        setCorpusStats({});
        throw new Error(data.error || 'Supabase RAG ist nicht erreichbar. Bitte prüfen Sie die Konfiguration.');
      }
      if (!data.success) throw new Error(data.error || 'Failed to load corpora');

      const corporaList: CorpusInfo[] = data.corpora;
      setCorpora(corporaList);

      // Load stats for each corpus in parallel
      const statsEntries = await Promise.allSettled(
        corporaList.map(async (corpus) => {
          const statsRes = await fetch(
            `/api/rag/corpus/stats?corpusName=${encodeURIComponent(corpus.displayName)}`
          );
          const statsData = await statsRes.json();
          if (!statsData.success) return { name: corpus.displayName, stats: null };
          return {
            name: corpus.displayName,
            stats: {
              documentCount: statsData.documentCount,
              chunkCount: statsData.chunkCount,
            } as CorpusStats,
          };
        })
      );

      const newStats: Record<string, CorpusStats> = {};
      for (const entry of statsEntries) {
        if (entry.status === 'fulfilled' && entry.value.stats) {
          newStats[entry.value.name] = entry.value.stats;
        }
      }
      setCorpusStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Corpora');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCorpora();
  }, [loadCorpora]);

  // Load documents for a corpus (lazy on expand)
  const loadDocuments = useCallback(async (corpusDisplayName: string) => {
    setLoadingDocuments(corpusDisplayName);
    try {
      const res = await fetch(
        `/api/rag/documents?corpusName=${encodeURIComponent(corpusDisplayName)}`
      );
      const data = await res.json();
      if (data.success) {
        setCorpusDocuments((prev) => ({ ...prev, [corpusDisplayName]: data.documents }));
      }
    } catch {
      // Silently fail — documents will just not show
    } finally {
      setLoadingDocuments(null);
    }
  }, []);

  // Toggle expand corpus
  const toggleCorpus = useCallback(
    (corpusDisplayName: string) => {
      if (expandedCorpus === corpusDisplayName) {
        setExpandedCorpus(null);
      } else {
        setExpandedCorpus(corpusDisplayName);
        if (!corpusDocuments[corpusDisplayName]) {
          loadDocuments(corpusDisplayName);
        }
      }
    },
    [expandedCorpus, corpusDocuments, loadDocuments]
  );

  // Delete corpus
  const handleDeleteCorpus = async (corpusDisplayName: string) => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/rag/corpus?name=${encodeURIComponent(corpusDisplayName)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDeleteModal(null);
      await loadCorpora();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentName: string, corpusDisplayName: string) => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/rag/documents?name=${encodeURIComponent(documentName)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setDeleteModal(null);
      // Reload documents for this corpus
      await loadDocuments(corpusDisplayName);
      // Reload stats
      await loadCorpora();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setDeleting(false);
    }
  };

  // Search test
  const handleSearchTest = async (corpusDisplayName: string) => {
    if (!searchTestQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpusName: corpusDisplayName,
          query: searchTestQuery,
          topK: 5,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Upload file
  const handleUpload = async (corpusDisplayName: string) => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('corpusName', corpusDisplayName);

      const res = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload fehlgeschlagen');

      setUploadModal(null);
      setSelectedFile(null);
      // Reload documents and stats
      await loadDocuments(corpusDisplayName);
      await loadCorpora();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Upload');
    } finally {
      setUploading(false);
    }
  };

  // Compute aggregated stats
  const totalStats = useMemo(() => {
    let totalDocuments = 0;
    let totalChunks = 0;
    let activeDocuments = 0;
    let pendingOrErrorDocuments = 0;

    for (const stats of Object.values(corpusStats)) {
      totalDocuments += stats.documentCount;
      totalChunks += stats.chunkCount;
    }

    // Count active/pending from loaded documents
    for (const docs of Object.values(corpusDocuments)) {
      for (const doc of docs) {
        if (doc.status === 'ACTIVE') activeDocuments++;
        else pendingOrErrorDocuments++;
      }
    }

    // If we haven't loaded documents yet, estimate from stats
    if (Object.keys(corpusDocuments).length === 0) {
      activeDocuments = totalDocuments;
    }

    return { totalDocuments, totalChunks, activeDocuments, pendingOrErrorDocuments };
  }, [corpusStats, corpusDocuments]);

  // Filter corpora
  const filteredCorpora = useMemo(() => {
    return corpora.filter((corpus) => {
      const matchesSearch =
        !searchQuery ||
        corpus.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        corpus.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'all') return matchesSearch;

      // Status filter applies to documents within the corpus
      const docs = corpusDocuments[corpus.displayName];
      if (!docs) return matchesSearch; // Can't filter by status without loaded docs

      if (statusFilter === 'active') return matchesSearch && docs.some((d) => d.status === 'ACTIVE');
      if (statusFilter === 'pending') return matchesSearch && docs.some((d) => d.status === 'PENDING');
      if (statusFilter === 'error') return matchesSearch && docs.some((d) => d.status === 'ERROR');

      return matchesSearch;
    });
  }, [corpora, searchQuery, statusFilter, corpusDocuments]);

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" /> Indexiert
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" size="sm">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Ausstehend
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="error" size="sm">
            <AlertTriangle className="w-3 h-3 mr-1" /> Fehler
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            Unbekannt
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600" />
              Administration
            </h1>
            <p className="text-gray-600 mt-1">
              RAG-Embeddings, Corpora und Dokumente verwalten
            </p>
          </div>
          <Button
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadCorpora}
            disabled={loading}
          >
            Aktualisieren
          </Button>
        </div>

        {/* Error Banner */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{corpora.length}</p>
                  <p className="text-sm text-gray-500">Corpora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalDocuments}</p>
                  <p className="text-sm text-gray-500">Dokumente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalChunks}</p>
                  <p className="text-sm text-gray-500">Chunks (indexiert)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.pendingOrErrorDocuments}</p>
                  <p className="text-sm text-gray-500">Ausstehend / Fehler</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Corpus oder Dokument suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'pending', 'error'] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      statusFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all' && 'Alle'}
                    {filter === 'active' && 'Aktiv'}
                    {filter === 'pending' && 'Ausstehend'}
                    {filter === 'error' && 'Fehler'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && corpora.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Corpora werden geladen...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredCorpora.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {corpora.length === 0
                  ? 'Keine Corpora vorhanden'
                  : 'Keine Corpora gefunden'}
              </h3>
              <p className="text-gray-500">
                {corpora.length === 0
                  ? 'Erstellen Sie ein Angebot und laden Sie Dokumente hoch, um RAG-Corpora zu erzeugen.'
                  : 'Versuchen Sie eine andere Suche oder anderen Filter.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Corpora List */}
        {!loading && filteredCorpora.length > 0 && (
          <div className="space-y-4">
            {filteredCorpora.map((corpus) => {
              const stats = corpusStats[corpus.displayName];
              const projectInfo = getProjectFromCorpus(corpus.displayName);
              const isExpanded = expandedCorpus === corpus.displayName;
              const docs = corpusDocuments[corpus.displayName];
              const isLoadingDocs = loadingDocuments === corpus.displayName;

              return (
                <Card key={corpus.name} className="overflow-hidden">
                  <CardContent className="py-4">
                    {/* Corpus Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Database className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{corpus.displayName}</h3>
                          {corpus.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{corpus.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            {stats && (
                              <>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  {stats.documentCount} Dokument{stats.documentCount !== 1 ? 'e' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Database className="w-3.5 h-3.5" />
                                  {stats.chunkCount} Chunks
                                </span>
                              </>
                            )}
                            {projectInfo && (
                              <Link
                                href={`/project/${projectInfo.id}`}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                {projectInfo.name || `Projekt ${projectInfo.id}`}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadModal(corpus.displayName);
                            setSelectedFile(null);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchModal(corpus.displayName);
                            setSearchTestQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <Search className="w-4 h-4 mr-1" /> Suche testen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              type: 'corpus',
                              corpusName: corpus.displayName,
                              displayName: corpus.displayName,
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCorpus(corpus.displayName)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: Document List */}
                    {isExpanded && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Dokumente</h4>

                        {isLoadingDocs && (
                          <div className="flex items-center gap-2 text-gray-500 py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Dokumente werden geladen...</span>
                          </div>
                        )}

                        {!isLoadingDocs && docs && docs.length === 0 && (
                          <p className="text-sm text-gray-400 py-4">
                            Keine Dokumente in diesem Corpus.
                          </p>
                        )}

                        {!isLoadingDocs && docs && docs.length > 0 && (
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <div
                                key={doc.name}
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-700">{doc.displayName}</span>
                                  {statusBadge(doc.status)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeleteModal({
                                      type: 'document',
                                      corpusName: corpus.displayName,
                                      documentName: doc.name,
                                      displayName: doc.displayName,
                                    })
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => !deleting && setDeleteModal(null)}
        title={
          deleteModal?.type === 'corpus' ? 'Corpus löschen' : 'Dokument löschen'
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {deleteModal?.type === 'corpus' ? (
              <>
                Möchten Sie den Corpus <strong>{deleteModal?.displayName}</strong> und alle
                enthaltenen Dokumente unwiderruflich löschen?
              </>
            ) : (
              <>
                Möchten Sie das Dokument <strong>{deleteModal?.displayName}</strong> unwiderruflich
                löschen?
              </>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={deleting}>
              Abbrechen
            </Button>
            <Button
              variant="danger"
              disabled={deleting}
              onClick={() => {
                if (!deleteModal) return;
                if (deleteModal.type === 'corpus') {
                  handleDeleteCorpus(deleteModal.corpusName);
                } else if (deleteModal.documentName) {
                  handleDeleteDocument(deleteModal.documentName, deleteModal.corpusName);
                }
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Löschen...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" /> Löschen
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={!!uploadModal}
        onClose={() => !uploading && setUploadModal(null)}
        title="Dokument hochladen"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Corpus: <strong>{uploadModal}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datei auswählen (PDF, DOCX, TXT)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name}</span>
              <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setUploadModal(null)} disabled={uploading}>
              Abbrechen
            </Button>
            <Button
              disabled={!selectedFile || uploading}
              onClick={() => uploadModal && handleUpload(uploadModal)}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Hochladen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" /> Hochladen
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Search Test Modal */}
      <Modal
        isOpen={!!searchModal}
        onClose={() => setSearchModal(null)}
        title="Embedding-Suche testen"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Corpus: <strong>{searchModal}</strong>
          </p>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Suchanfrage eingeben..."
                value={searchTestQuery}
                onChange={(e) => setSearchTestQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchModal) handleSearchTest(searchModal);
                }}
              />
            </div>
            <Button
              onClick={() => searchModal && handleSearchTest(searchModal)}
              disabled={searching || !searchTestQuery.trim()}
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      #{index + 1} — {result.source}
                    </span>
                    <Badge
                      variant={result.score >= 0.7 ? 'success' : result.score >= 0.4 ? 'warning' : 'default'}
                      size="sm"
                    >
                      Score: {result.scorePercent}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!searching && searchResults.length === 0 && searchTestQuery && (
            <p className="text-sm text-gray-400 text-center py-4">
              Keine Ergebnisse. Geben Sie eine Suchanfrage ein und klicken Sie auf Suchen.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

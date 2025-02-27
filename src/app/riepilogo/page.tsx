'use client';

import { useState, useEffect, FC } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Package, 
  Edit, 
  CheckCircle, 
  XCircle, 
  X, 
  Send, 
  AlertCircle
} from 'lucide-react';

// Definizione dei tipi
interface PackageData {
  id: number;
  trackingNumber: string;
  recipient: string;
  email: string;
  arrivalDate: string;
  status: 'arrivato' | 'in consegna' | 'completato' | 'cancellato';
  notes: string;
  emailSent: string;
  location: string;
}

type SortConfig = {
  key: keyof PackageData;
  direction: 'asc' | 'desc';
};

// Mappatura colori per status
const statusColors: Record<PackageData['status'], string> = {
  arrivato: 'bg-blue-100 text-blue-800 border-blue-200',
  'in consegna': 'bg-amber-100 text-amber-800 border-amber-200',
  completato: 'bg-green-100 text-green-800 border-green-200',
  cancellato: 'bg-red-100 text-red-800 border-red-200'
};

// Dati di esempio
const initialPackages: PackageData[] = [
  { 
    id: 1, 
    trackingNumber: 'TRK12345678', 
    recipient: 'Mario Rossi', 
    email: 'mario.rossi@thelios.com', 
    arrivalDate: '2025-02-20T10:30:00', 
    status: 'arrivato', 
    notes: 'Pacco fragile, maneggiare con cura',
    emailSent: '2025-02-20T10:35:00',
    location: 'Magazzino A, Scaffale 3'
  },
  { 
    id: 2, 
    trackingNumber: 'TRK87654321', 
    recipient: 'Laura Bianchi', 
    email: 'laura.bianchi@thelios.com', 
    arrivalDate: '2025-02-21T09:15:00', 
    status: 'in consegna', 
    notes: 'Contiene documenti confidenziali',
    emailSent: '2025-02-21T09:20:00',
    location: 'Ufficio Ricezione, Zona B'
  },
  { 
    id: 3, 
    trackingNumber: 'TRK98765432', 
    recipient: 'Giovanni Verdi', 
    email: 'giovanni.verdi@thelios.com', 
    arrivalDate: '2025-02-18T14:45:00', 
    status: 'completato', 
    notes: 'Ritirato personalmente dal destinatario',
    emailSent: '2025-02-18T14:50:00',
    location: 'Magazzino B, Scaffale 1'
  },
  { 
    id: 4, 
    trackingNumber: 'TRK23456789', 
    recipient: 'Anna Neri', 
    email: 'anna.neri@thelios.com', 
    arrivalDate: '2025-02-19T11:20:00', 
    status: 'cancellato', 
    notes: 'Pacco danneggiato durante il trasporto',
    emailSent: '2025-02-19T11:25:00',
    location: 'Area Resi, Sezione C'
  },
  { 
    id: 5, 
    trackingNumber: 'TRK34567890', 
    recipient: 'Francesco Blu', 
    email: 'francesco.blu@thelios.com', 
    arrivalDate: '2025-02-22T08:00:00', 
    status: 'arrivato', 
    notes: 'Alto valore, richiede firma alla consegna',
    emailSent: '2025-02-22T08:05:00',
    location: 'Magazzino Sicurezza, Zona 1'
  },
];

const PackageManagementTable: FC = () => {
  const [packages, setPackages] = useState<PackageData[]>(initialPackages);
  const [filteredPackages, setFilteredPackages] = useState<PackageData[]>(initialPackages);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<PackageData['status'][]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [dialogPackageId, setDialogPackageId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'arrivalDate', 
    direction: 'desc' 
  });

  // Ordinamento
  const requestSort = (key: keyof PackageData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtra i pacchi in base ai filtri selezionati
  useEffect(() => {
    let result = packages;
    
    // Filtra per termine di ricerca
    if (searchTerm) {
      result = result.filter(pkg => 
        pkg.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtra per stati selezionati
    if (selectedStatuses.length > 0) {
      result = result.filter(pkg => selectedStatuses.includes(pkg.status));
    }
    
    // Ordinamento
    result = [...result].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredPackages(result);
  }, [packages, searchTerm, selectedStatuses, sortConfig]);

  // Toggle selezione stato
  const toggleStatus = (status: PackageData['status']) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  // Formatta data e ora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Gestisci click sulla riga
  const handleRowClick = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setSidebarOpen(true);
  };

  // Aggiorna lo stato del pacco
  const updatePackageStatus = (id: number, newStatus: PackageData['status']) => {
    setPackages(prev =>
      prev.map(pkg =>
        pkg.id === id ? { ...pkg, status: newStatus } : pkg
      )
    );
    
    if (selectedPackage && selectedPackage.id === id) {
      setSelectedPackage(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Gestisci conferma completamento
  const handleCompleteConfirm = () => {
    if (dialogPackageId) {
      updatePackageStatus(dialogPackageId, 'completato');
    }
    setShowConfirmDialog(false);
    setDialogPackageId(null);
  };

  // Gestisci conferma cancellazione
  const handleDeleteConfirm = () => {
    if (dialogPackageId) {
      updatePackageStatus(dialogPackageId, 'cancellato');
    }
    setShowDeleteDialog(false);
    setDialogPackageId(null);
  };

  // Invia nuovo remind
  const sendNewReminder = (id: number) => {
    setPackages(prev =>
      prev.map(pkg =>
        pkg.id === id ? { ...pkg, emailSent: new Date().toISOString() } : pkg
      )
    );
    
    if (selectedPackage && selectedPackage.id === id) {
      setSelectedPackage(prev => prev ? { ...prev, emailSent: new Date().toISOString() } : null);
    }
    
    if (selectedPackage) {
      alert(`Email di remind inviata a ${selectedPackage.email}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Pacchi in Giacenza</h1>
      
      {/* Filtri e ricerca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cerca per tracking, nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <div className="relative inline-block text-left w-full">
            <div className="flex flex-wrap gap-2">
              {(['arrivato', 'in consegna', 'completato', 'cancellato'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                    selectedStatuses.includes(status) 
                      ? statusColors[status] + ' ring-2 ring-offset-1'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabella */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('trackingNumber')}
              >
                <div className="flex items-center">
                  Tracking Number
                  {sortConfig.key === 'trackingNumber' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('recipient')}
              >
                <div className="flex items-center">
                  Destinatario
                  {sortConfig.key === 'recipient' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('arrivalDate')}
              >
                <div className="flex items-center">
                  Data Arrivo
                  {sortConfig.key === 'arrivalDate' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center">
                  Stato
                  {sortConfig.key === 'status' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPackages.map((pkg) => (
              <tr 
                key={pkg.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => handleRowClick(pkg)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    {pkg.trackingNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium text-gray-900">{pkg.recipient}</div>
                    <div className="text-gray-500 text-xs">{pkg.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(pkg.arrivalDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[pkg.status]}`}>
                    {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(pkg);
                        }}
                        className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {pkg.status !== 'completato' && pkg.status !== 'cancellato' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogPackageId(pkg.id);
                            setShowConfirmDialog(true);
                          }}
                          className="text-green-600 hover:text-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {pkg.status !== 'cancellato' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogPackageId(pkg.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessun pacco trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Sidebar dettagli */}
      {sidebarOpen && selectedPackage && (
        <div className="fixed inset-0 overflow-hidden z-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)}></div>
            
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="relative w-screen max-w-2xl">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                  {/* Header */}
                  <div className="flex-shrink-0 px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">
                        Dettagli Pacco
                      </h2>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Chiudi</span>
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {selectedPackage.trackingNumber}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedPackage.status]}`}>
                          {selectedPackage.status.charAt(0).toUpperCase() + selectedPackage.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Destinatario</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedPackage.recipient}</p>
                          <p className="text-sm text-gray-500">{selectedPackage.email}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Data di Arrivo</h4>
                          <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedPackage.arrivalDate)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Posizione</h4>
                          <p className="mt-1 text-sm text-gray-900">{selectedPackage.location}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Modifica Stato</h4>
                          <select
                            value={selectedPackage.status}
                            onChange={(e) => updatePackageStatus(
                              selectedPackage.id, 
                              e.target.value as PackageData['status']
                            )}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="arrivato">Arrivato</option>
                            <option value="in consegna">In consegna</option>
                            <option value="completato">Completato</option>
                            <option value="cancellato">Cancellato</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-8">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Note</h4>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm text-gray-700">{selectedPackage.notes || 'Nessuna nota disponibile'}</p>
                        </div>
                      </div>
                      
                      <div className="mb-6 bg-blue-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Comunicazioni</h4>
                        <p className="text-sm text-blue-700">
                          Inviata email a {selectedPackage.email} il {formatDateTime(selectedPackage.emailSent)}
                        </p>
                        
                        <button
                          onClick={() => sendNewReminder(selectedPackage.id)}
                          className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Invia nuovo remind
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dialog di conferma completamento */}
      {showConfirmDialog && (
        <div className="fixed z-30 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowConfirmDialog(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Conferma completamento
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Sei sicuro di voler contrassegnare questo pacco come completato? Questa azione indica che il pacco è stato consegnato al destinatario.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCompleteConfirm}
                >
                  Conferma
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dialog di conferma cancellazione */}
      {showDeleteDialog && (
        <div className="fixed z-30 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteDialog(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Conferma cancellazione
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Sei sicuro di voler cancellare questo pacco? Il record rimarrà nel database ma sarà contrassegnato come &quot;cancellato&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                >
                  Cancella
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagementTable;
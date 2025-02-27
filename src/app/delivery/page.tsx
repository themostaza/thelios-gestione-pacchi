'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Scan, 
  Search, 
  User, 
  Mail, 
  X, 
  Package, 
  Send, 
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';

// Definizione dei tipi
interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
}

interface RecognitionResult {
  confidence: number;
  text: string;
}

type CameraStatus = 'inactive' | 'active' | 'captured';
type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

const PackageRegistrationPage: React.FC = () => {
  // Riferimenti
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Stati
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('inactive');
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Esempio di dipendenti
  const employees: Employee[] = [
    { id: 1, name: 'Marco Rossi', email: 'marco.rossi@thelios.com', department: 'IT' },
    { id: 2, name: 'Laura Bianchi', email: 'laura.bianchi@thelios.com', department: 'HR' },
    { id: 3, name: 'Giovanni Verdi', email: 'giovanni.verdi@thelios.com', department: 'Marketing' },
    { id: 4, name: 'Anna Neri', email: 'anna.neri@thelios.com', department: 'Vendite' },
    { id: 5, name: 'Francesco Blu', email: 'francesco.blu@thelios.com', department: 'R&D' },
    { id: 6, name: 'Marco Bianchi', email: 'marco.bianchi@thelios.com', department: 'IT' },
  ];

  // Filtra i dipendenti in base all'input
  const filteredEmployees = recipientName 
    ? employees.filter(emp => 
        emp.name.toLowerCase().includes(recipientName.toLowerCase()) ||
        emp.email.toLowerCase().includes(recipientName.toLowerCase())
      )
    : [];

  // Avvia la fotocamera
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setMediaStream(stream);
        setCameraStatus('active');
      }
    } catch (error) {
      console.error('Errore accesso alla fotocamera:', error);
      setHasCamera(false);
    }
  };

  // Ferma la fotocamera
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraStatus('inactive');
  };

  // Scatta foto
  const captureImage = () => {
    if (videoRef.current && canvasRef.current && cameraStatus === 'active') {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Imposta le dimensioni del canvas uguali al video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Disegna il frame corrente del video sul canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converti il canvas in un'immagine base64
        const imageData = canvas.toDataURL('image/jpeg');
        setImageSrc(imageData);
        setCameraStatus('captured');
        
        // Stoppa la camera dopo aver scattato la foto
        stopCamera();
        
        // Analizza l'immagine
        analyzeImage(imageData);
      }
    }
  };

  // Simula l'analisi dell'immagine con AI
  const analyzeImage = (imageData: string) => {
    setProcessingStatus('processing');
    console.log(imageData)
    
    // Simuliamo una richiesta API per l'analisi dell'immagine
    setTimeout(() => {
      // In un'app reale, qui chiameremmo un servizio AI per l'analisi
      const simulatedResult: RecognitionResult = {
        confidence: 0.85,
        text: "Marco Rossi - IT Dept"
      };
      
      if (simulatedResult.confidence > 0.7) {
        setRecipientName(simulatedResult.text);
        setProcessingStatus('success');
      } else {
        setProcessingStatus('error');
      }
    }, 2000);
  };

  // Carica immagine da file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageSrc(result);
        setCameraStatus('captured');
        analyzeImage(result);
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Gestisci click sul pulsante per caricare file
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Seleziona un dipendente
  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setRecipientName(employee.name);
    setShowResults(false);
  };

  // Resetta la fotocamera
  const resetCamera = () => {
    setImageSrc(null);
    setCameraStatus('inactive');
    setProcessingStatus('idle');
    startCamera();
  };

  // Gestisci l'invio del form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simuliamo l'invio dei dati
    setTimeout(() => {
      // In un'app reale, qui invieremmo i dati al backend
      console.log('Dati inviati:', {
        recipient: selectedEmployee,
        notes,
        timestamp: new Date().toISOString()
      });
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset form dopo 3 secondi
      setTimeout(() => {
        setImageSrc(null);
        setRecipientName('');
        setSelectedEmployee(null);
        setNotes('');
        setProcessingStatus('idle');
        setCameraStatus('inactive');
        setSubmitSuccess(false);
      }, 3000);
    }, 1500);
  };

  // Gestisci il focus sull'input di ricerca
  const handleSearchFocus = () => {
    if (recipientName.length > 0) {
      setShowResults(true);
    }
  };

  // Cleanup camera quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Registrazione Nuovo Pacco</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sezione Foto Etichetta */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
              <Scan className="mr-2 h-5 w-5 text-blue-500" />
              Scansione Etichetta
            </h2>
            
            <div className="space-y-4">
              {/* Visualizzazione della fotocamera o dell'immagine scattata */}
              {cameraStatus === 'active' && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline
                  />
                  <button
                    type="button"
                    onClick={captureImage}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 p-3 rounded-full shadow-lg"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                </div>
              )}
              
              {cameraStatus === 'captured' && imageSrc && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <img 
                    src={imageSrc} 
                    alt="Etichetta scansionata" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={resetCamera}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {cameraStatus === 'inactive' && !imageSrc && (
                <div className="flex flex-col gap-3 items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Package className="h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-500 text-center">
                    Scatta una foto dell&apos;etichetta o carica un&apos;immagine
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={!hasCamera}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        hasCamera
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Camera className="h-4 w-4 inline mr-2" />
                      Fotocamera
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Carica file
                    </button>
                  </div>
                </div>
              )}
              
              {/* Input nascosto per il caricamento del file */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              
              {/* Canvas nascosto per la cattura dell'immagine */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Indicatore di stato elaborazione */}
              {processingStatus === 'processing' && (
                <div className="flex items-center justify-center space-x-2 py-2 text-blue-600">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Analisi in corso...</span>
                </div>
              )}
              
              {processingStatus === 'success' && (
                <div className="flex items-center space-x-2 py-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Analisi completata con successo</span>
                </div>
              )}
              
              {processingStatus === 'error' && (
                <div className="flex items-center space-x-2 py-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Inserisci manualmente il destinatario</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Ricerca Destinatario */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-500" />
              Identificazione Destinatario
            </h2>
            
            <div className="space-y-4">
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    setShowResults(e.target.value.length > 0);
                    setSelectedEmployee(null);
                  }}
                  onFocus={handleSearchFocus}
                  placeholder="Cerca nome o email del destinatario"
                  className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-base"
                />
                {recipientName && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientName('');
                      setShowResults(false);
                      setSelectedEmployee(null);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                )}
              </div>
              
              {/* Risultati della ricerca */}
              {showResults && filteredEmployees.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-w-md bg-white rounded-md shadow-xl max-h-60 overflow-auto">
                  <ul className="py-1">
                    {filteredEmployees.map((employee) => (
                      <li key={employee.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectEmployee(employee)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-300 flex items-start"
                        >
                          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                            <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                            <p className="text-xs text-gray-400 truncate">{employee.department}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showResults && filteredEmployees.length === 0 && (
                <div className="absolute z-11 mt-1 w-full max-w-md bg-white rounded-md shadow-lg p-4">
                  <p className="text-sm text-gray-500">Nessun risultato trovato</p>
                </div>
              )}
              
              {/* Scheda destinatario selezionato */}
              {selectedEmployee && (
                <div className="mt-4 flex items-start p-3 bg-blue-50 rounded-md">
                  <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {selectedEmployee.email}
                    </p>
                    <p className="text-xs text-gray-400">{selectedEmployee.department}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Note aggiuntive */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-4 text-gray-700">Note (opzionale)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi informazioni sul pacco, istruzioni speciali, ecc."
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Pulsante di invio */}
          <button
            type="submit"
            disabled={!selectedEmployee || isSubmitting || submitSuccess}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !selectedEmployee || isSubmitting || submitSuccess
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                Invio in corso...
              </>
            ) : submitSuccess ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Inviato con successo!
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Registra consegna e avvisa destinatario
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PackageRegistrationPage;
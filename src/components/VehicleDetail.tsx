import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle, InspectionStatus, TeamNote } from '../types/vehicle';
import { mockVehicles } from '../data/mockVehicles';
import InspectionChecklist from './InspectionChecklist';
import TeamNotes from './TeamNotes';
import StatusBadge from './StatusBadge';
import { 
  ArrowLeft, 
  Car, 
  Gauge, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Circle, 
  Tag, 
  Archive, 
  Clock3, 
  Trash2, 
  Edit3,
  Save,
  X,
  Leaf,
  Palette,
  Wrench,
  Sparkles,
  Camera,
  Filter
} from 'lucide-react';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inspection' | 'notes'>('inspection');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [sellData, setSellData] = useState({
    price: 0,
    soldBy: user?.initials || '',
    notes: ''
  });
  const [pendingData, setPendingData] = useState({
    pendingBy: user?.initials || '',
    notes: ''
  });

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = () => {
    setIsLoading(true);
    
    // Start with mock vehicles
    let allVehicles = [...mockVehicles];

    // Load added vehicles from localStorage
    const savedAddedVehicles = localStorage.getItem('addedVehicles');
    if (savedAddedVehicles) {
      try {
        const addedVehicles = JSON.parse(savedAddedVehicles);
        allVehicles = [...addedVehicles, ...allVehicles];
      } catch (error) {
        console.error('Error loading added vehicles:', error);
      }
    }

    // Load vehicle updates from localStorage
    const savedUpdates = localStorage.getItem('vehicleUpdates');
    if (savedUpdates) {
      try {
        const updates = JSON.parse(savedUpdates);
        allVehicles = allVehicles.map(v => 
          updates[v.id] ? { ...v, ...updates[v.id] } : v
        );
      } catch (error) {
        console.error('Error loading vehicle updates:', error);
      }
    }

    // Find the vehicle by ID
    const foundVehicle = allVehicles.find(v => v.id === id);
    
    // If not found in active vehicles, check sold vehicles
    if (!foundVehicle) {
      const savedSoldVehicles = localStorage.getItem('soldVehicles');
      if (savedSoldVehicles) {
        try {
          const soldVehicles = JSON.parse(savedSoldVehicles);
          const soldVehicle = soldVehicles.find((v: Vehicle) => v.id === id);
          if (soldVehicle) {
            setVehicle(soldVehicle);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading sold vehicles:', error);
        }
      }

      // Check pending vehicles
      const savedPendingVehicles = localStorage.getItem('pendingVehicles');
      if (savedPendingVehicles) {
        try {
          const pendingVehicles = JSON.parse(savedPendingVehicles);
          const pendingVehicle = pendingVehicles.find((v: Vehicle) => v.id === id);
          if (pendingVehicle) {
            setVehicle(pendingVehicle);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading pending vehicles:', error);
        }
      }

      // If still not found, show error
      setVehicle(null);
      setIsLoading(false);
      return;
    }

    setVehicle(foundVehicle);
    setEditedNotes(foundVehicle.notes || '');
    setSellData(prev => ({ ...prev, price: foundVehicle.price }));
    setIsLoading(false);
  };

  const handleStatusUpdate = (section: keyof Vehicle['status'], status: InspectionStatus) => {
    if (!vehicle) return;

    const updatedVehicle = {
      ...vehicle,
      status: {
        ...vehicle.status,
        [section]: status
      }
    };

    setVehicle(updatedVehicle);
    saveVehicleUpdate(updatedVehicle);
  };

  const handleSectionComplete = (section: keyof Vehicle['status'], userInitials: string) => {
    if (!vehicle) return;

    // This function can be used to record analytics or add team notes when a section is completed
    const sectionName = section === 'cleaned' ? 'cleaning' : section;
    
    const newNote: Omit<TeamNote, 'id' | 'timestamp'> = {
      text: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section marked as completed.`,
      userInitials,
      category: sectionName as any
    };

    handleAddTeamNote(newNote);
  };

  const handleAddTeamNote = (note: Omit<TeamNote, 'id' | 'timestamp'>) => {
    if (!vehicle) return;

    const newNote: TeamNote = {
      ...note,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const updatedVehicle = {
      ...vehicle,
      teamNotes: [...(vehicle.teamNotes || []), newNote]
    };

    // If it's a summary note, also update the vehicle notes
    if (note.category === 'summary') {
      updatedVehicle.notes = updatedVehicle.notes 
        ? `${updatedVehicle.notes}\n\n${note.text}` 
        : note.text;
      setEditedNotes(updatedVehicle.notes);
    }

    setVehicle(updatedVehicle);
    saveVehicleUpdate(updatedVehicle);
  };

  const handleSaveNotes = () => {
    if (!vehicle) return;

    const updatedVehicle = {
      ...vehicle,
      notes: editedNotes
    };

    setVehicle(updatedVehicle);
    saveVehicleUpdate(updatedVehicle);
    setIsEditingNotes(false);
  };

  const handleSellVehicle = () => {
    if (!vehicle) return;

    const soldVehicle: Vehicle = {
      ...vehicle,
      isSold: true,
      soldBy: sellData.soldBy,
      soldDate: new Date().toISOString(),
      soldPrice: sellData.price,
      soldNotes: sellData.notes
    };

    // Save to sold vehicles
    const savedSoldVehicles = localStorage.getItem('soldVehicles');
    const soldVehicles = savedSoldVehicles ? JSON.parse(savedSoldVehicles) : [];
    soldVehicles.push(soldVehicle);
    localStorage.setItem('soldVehicles', JSON.stringify(soldVehicles));

    // Update vehicle updates
    saveVehicleUpdate(soldVehicle);

    // Trigger storage event for other components to listen to
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'soldVehicles',
      newValue: JSON.stringify(soldVehicles)
    }));

    setShowSellModal(false);
    navigate('/');
  };

  const handleMarkAsPending = () => {
    if (!vehicle) return;

    const pendingVehicle: Vehicle = {
      ...vehicle,
      isPending: true,
      pendingBy: pendingData.pendingBy,
      pendingDate: new Date().toISOString(),
      pendingNotes: pendingData.notes
    };

    // Save to pending vehicles
    const savedPendingVehicles = localStorage.getItem('pendingVehicles');
    const pendingVehicles = savedPendingVehicles ? JSON.parse(savedPendingVehicles) : [];
    pendingVehicles.push(pendingVehicle);
    localStorage.setItem('pendingVehicles', JSON.stringify(pendingVehicles));

    // Update vehicle updates
    saveVehicleUpdate(pendingVehicle);

    // Trigger storage event for other components to listen to
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pendingVehicles',
      newValue: JSON.stringify(pendingVehicles)
    }));

    setShowPendingModal(false);
    navigate('/');
  };

  const handleDeleteVehicle = () => {
    if (!vehicle || !window.confirm('Are you sure you want to permanently delete this vehicle?')) return;

    // Remove from vehicle updates
    const savedUpdates = localStorage.getItem('vehicleUpdates');
    if (savedUpdates) {
      try {
        const updates = JSON.parse(savedUpdates);
        delete updates[vehicle.id];
        localStorage.setItem('vehicleUpdates', JSON.stringify(updates));
      } catch (error) {
        console.error('Error updating vehicle updates:', error);
      }
    }

    // Remove from added vehicles if it exists there
    const savedAddedVehicles = localStorage.getItem('addedVehicles');
    if (savedAddedVehicles) {
      try {
        const addedVehicles = JSON.parse(savedAddedVehicles);
        const filteredVehicles = addedVehicles.filter((v: Vehicle) => v.id !== vehicle.id);
        localStorage.setItem('addedVehicles', JSON.stringify(filteredVehicles));
      } catch (error) {
        console.error('Error updating added vehicles:', error);
      }
    }

    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'vehicleUpdates',
      newValue: localStorage.getItem('vehicleUpdates')
    }));

    navigate('/');
  };

  const saveVehicleUpdate = (updatedVehicle: Vehicle) => {
    const savedUpdates = localStorage.getItem('vehicleUpdates');
    const updates = savedUpdates ? JSON.parse(savedUpdates) : {};
    updates[updatedVehicle.id] = updatedVehicle;
    localStorage.setItem('vehicleUpdates', JSON.stringify(updates));

    // Trigger storage event for other components to listen to
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'vehicleUpdates',
      newValue: JSON.stringify(updates)
    }));
  };

  const getStockNumber = (vin: string): string => {
    return vin.slice(-6);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDaysInInventory = (dateAcquired: string) => {
    const acquiredDate = new Date(dateAcquired);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - acquiredDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverallProgress = (vehicle: Vehicle) => {
    const statuses = Object.values(vehicle.status);
    const completed = statuses.filter(status => status === 'completed').length;
    return (completed / statuses.length) * 100;
  };

  const isReadyForSale = (vehicle: Vehicle) => {
    return Object.values(vehicle.status).every(status => status === 'completed');
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'emissions':
        return Leaf;
      case 'cosmetic':
        return Palette;
      case 'mechanical':
        return Wrench;
      case 'cleaned':
        return Sparkles;
      case 'photos':
        return Camera;
      default:
        return Tag;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900/20 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vehicle Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The vehicle you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-white/20 dark:border-gray-700/20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Vehicle Details</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Reconditioning Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!vehicle.isSold && !vehicle.isPending && (
                <>
                  <button
                    onClick={() => setShowSellModal(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Mark as Sold
                  </button>
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Mark as Pending
                  </button>
                </>
              )}
              <button
                onClick={handleDeleteVehicle}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete Vehicle"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Vehicle Info Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left Column - Vehicle Details */}
              <div className="flex-1">
                {/* Vehicle Title */}
                <div className="mb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  {vehicle.trim && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                      {vehicle.trim} - {vehicle.color}
                    </p>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {vehicle.isSold && (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold border border-green-200 dark:border-green-700">
                      <Archive className="w-4 h-4" />
                      Sold Vehicle
                    </div>
                  )}
                  
                  {vehicle.isPending && (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-semibold border border-yellow-200 dark:border-yellow-700">
                      <Clock3 className="w-4 h-4" />
                      Pending Sale
                    </div>
                  )}
                  
                  {!vehicle.isSold && !vehicle.isPending && isReadyForSale(vehicle) && (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-semibold border border-emerald-200 dark:border-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready for Sale
                    </div>
                  )}
                </div>

                {/* Vehicle Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Stock #</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getStockNumber(vehicle.vin)}</p>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Gauge className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Mileage</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{vehicle.mileage.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Acquired</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(vehicle.dateAcquired)}</p>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Location</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{vehicle.location}</p>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(vehicle.price)}</p>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Days in Stock</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{getDaysInInventory(vehicle.dateAcquired)}</p>
                  </div>
                </div>

                {/* Vehicle Notes */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Vehicle Notes
                    </h3>
                    {!isEditingNotes ? (
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveNotes}
                          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingNotes(false);
                            setEditedNotes(vehicle.notes || '');
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isEditingNotes ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={4}
                      placeholder="Add notes about this vehicle..."
                    />
                  ) : (
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                      {vehicle.notes ? (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{vehicle.notes}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No notes added yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Overview */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Reconditioning Progress</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Completion</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(getOverallProgress(vehicle))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          getOverallProgress(vehicle) === 100 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}
                        style={{ width: `${getOverallProgress(vehicle)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Section Status Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(vehicle.status).map(([section, status]) => {
                      const SectionIcon = getSectionIcon(section);
                      const sectionLabel = section === 'cleaned' ? 'Cleaning' : section.charAt(0).toUpperCase() + section.slice(1);
                      
                      return (
                        <button
                          key={section}
                          onClick={() => setActiveFilter(activeFilter === section ? null : section)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                            activeFilter === section
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                              : status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/30'
                                : status === 'needs-attention'
                                  ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/30'
                                  : status === 'pending'
                                    ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800/30'
                                    : 'border-gray-200 bg-gray-50 dark:bg-gray-700/30 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              status === 'completed' ? 'bg-emerald-500' :
                              status === 'needs-attention' ? 'bg-red-500' :
                              status === 'pending' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}>
                              <SectionIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${
                              status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' :
                              status === 'needs-attention' ? 'text-red-700 dark:text-red-400' :
                              status === 'pending' ? 'text-yellow-700 dark:text-yellow-400' :
                              'text-gray-700 dark:text-gray-400'
                            }`}>
                              {sectionLabel}
                            </span>
                            <div className="flex items-center gap-1">
                              {status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                              {status === 'needs-attention' && <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />}
                              {status === 'pending' && <Clock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />}
                              {status === 'not-started' && <Circle className="w-3 h-3 text-gray-400 dark:text-gray-500" />}
                              <span className={`text-xs ${
                                status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                status === 'needs-attention' ? 'text-red-600 dark:text-red-400' :
                                status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-gray-500 dark:text-gray-400'
                              }`}>
                                {status === 'completed' ? 'Done' :
                                 status === 'needs-attention' ? 'Issues' :
                                 status === 'pending' ? 'Working' :
                                 'Not Started'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - VIN and Status */}
              <div className="lg:w-80 space-y-4">
                {/* VIN Card */}
                <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">VIN</h3>
                  <p className="text-lg font-mono font-bold text-gray-900 dark:text-white tracking-wider">{vehicle.vin}</p>
                </div>

                {/* Sold Info (if sold) */}
                {vehicle.isSold && (
                  <div className="bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm p-4 rounded-lg border border-green-200/60 dark:border-green-800/30">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Sold Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Sold Date</p>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {vehicle.soldDate ? formatDate(vehicle.soldDate) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Sold Price</p>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {vehicle.soldPrice ? formatPrice(vehicle.soldPrice) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400">Sold By</p>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          {vehicle.soldBy || 'N/A'}
                        </p>
                      </div>
                      {vehicle.soldNotes && (
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-400">Notes</p>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            {vehicle.soldNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending Info (if pending) */}
                {vehicle.isPending && (
                  <div className="bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm p-4 rounded-lg border border-yellow-200/60 dark:border-yellow-800/30">
                    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      Pending Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending Since</p>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          {vehicle.pendingDate ? formatDate(vehicle.pendingDate) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Marked By</p>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          {vehicle.pendingBy || 'N/A'}
                        </p>
                      </div>
                      {vehicle.pendingNotes && (
                        <div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">Notes</p>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            {vehicle.pendingNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reactivation Info (if reactivated) */}
                {vehicle.reactivatedFrom && (
                  <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm p-4 rounded-lg border border-blue-200/60 dark:border-blue-800/30">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Reactivation Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Reactivated On</p>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {vehicle.reactivatedDate ? formatDate(vehicle.reactivatedDate) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Reactivated By</p>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {vehicle.reactivatedBy || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Previous Status</p>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          {vehicle.reactivatedFrom === 'sold' ? 'Sold' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Status Summary */}
                <div className="bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-200/60 dark:border-gray-600/60">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Section Status</h3>
                  <div className="space-y-3">
                    {Object.entries(vehicle.status).map(([section, status]) => {
                      const SectionIcon = getSectionIcon(section);
                      const sectionLabel = section === 'cleaned' ? 'Cleaning' : section.charAt(0).toUpperCase() + section.slice(1);
                      
                      return (
                        <div key={section} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SectionIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{sectionLabel}</span>
                          </div>
                          <StatusBadge status={status} label={status} section={section} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="flex">
              <button
                onClick={() => setActiveTab('inspection')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'inspection'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md border border-blue-100 dark:border-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Inspection Checklist
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'notes'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md border border-blue-100 dark:border-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <FileText className="w-5 h-5" />
                Team Notes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'inspection' && (
              <InspectionChecklist 
                vehicle={vehicle} 
                onStatusUpdate={handleStatusUpdate}
                onSectionComplete={handleSectionComplete}
                onAddTeamNote={handleAddTeamNote}
                activeFilter={activeFilter}
              />
            )}
            
            {activeTab === 'notes' && (
              <TeamNotes 
                notes={vehicle.teamNotes || []} 
                onAddNote={handleAddTeamNote} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mark Vehicle as Sold</h3>
                <button
                  onClick={() => setShowSellModal(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sale Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <input
                      type="number"
                      value={sellData.price}
                      onChange={(e) => setSellData({ ...sellData, price: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter sale price"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sold By (Initials)
                  </label>
                  <input
                    type="text"
                    value={sellData.soldBy}
                    onChange={(e) => setSellData({ ...sellData, soldBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your initials"
                    maxLength={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={sellData.notes}
                    onChange={(e) => setSellData({ ...sellData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add any notes about the sale"
                    rows={3}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleSellVehicle}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Mark as Sold
                  </button>
                  <button
                    onClick={() => setShowSellModal(false)}
                    className="flex-1 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mark Vehicle as Pending</h3>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Marked By (Initials)
                  </label>
                  <input
                    type="text"
                    value={pendingData.pendingBy}
                    onChange={(e) => setPendingData({ ...pendingData, pendingBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your initials"
                    maxLength={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={pendingData.notes}
                    onChange={(e) => setPendingData({ ...pendingData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add any notes about the pending status"
                    rows={3}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={handleMarkAsPending}
                    className="flex-1 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => setShowPendingModal(false)}
                    className="flex-1 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetail;
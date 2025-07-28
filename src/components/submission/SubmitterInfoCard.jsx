import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, Mail, Phone, Briefcase, Hash, MapPin, 
  Calendar, Award, GraduationCap, Home, Clock,
  UserCircle, CalendarDays, UserCheck, BookOpen, Building2,
  PhoneCall, Cake, MapPinned, Check, Copy, User as UserIcon,
  Users, Tag, Calendar as CalendarIcon, Book, MapPin as MapPinIcon,
  CreditCard, UserCog, FileText, UserPlus, UserMinus, UserX, UserCheck as UserCheckIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define field type for better type checking
const FieldType = {
  TEXT: 'text',
  DATE: 'date',
  PHONE: 'phone',
  EMAIL: 'email',
  CUSTOM: 'custom'
};

// Define field interface
const fieldSchema = {
  label: '',
  key: '',
  type: FieldType.TEXT,
  icon: null,
  colSpan: 1,
  copyable: false,
  format: null,
  render: null
};

const SubmitterInfoCard = ({ personalInfo = {} }) => {
  // Debug logging to understand what data we're receiving
  console.group('=== SubmitterInfoCard Debug ===');
  console.log('Received personalInfo:', personalInfo);
  console.log('PersonalInfo type:', typeof personalInfo);
  console.log('PersonalInfo keys:', personalInfo ? Object.keys(personalInfo) : 'No keys');
  console.groupEnd();
  // Format phone number
  const formatPhone = (phone) => {
    if (!phone || phone === '-') return '-';
    try {
      const cleaned = phone.toString().replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
      } else if (cleaned.startsWith('62')) {
        return cleaned.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3').replace(/^62/, '0');
      } else if (cleaned.length > 0) {
        // If we have numbers but not in expected format, just return as is
        return cleaned;
      }
      return '-';
    } catch (e) {
      console.error('Error formatting phone number:', phone, e);
      return phone || '-';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
      // Handle both string and Date objects
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in SubmitterInfoCard:', dateString);
        return '-';
      }
      
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date in SubmitterInfoCard:', dateString, e);
      return '-';
    }
  };

  // Get field with fallback and formatting
  const getField = (key, defaultValue = '-', format = null) => {
    try {
      // Handle dot notation for nested fields
      const keys = Array.isArray(key) ? key : [key];
      let value = null;

      // Safety check for personalInfo
      if (!personalInfo || typeof personalInfo !== 'object') {
        console.warn('PersonalInfo is not available or not an object:', personalInfo);
        return defaultValue;
      }

      // Try to find the first non-null value from the keys array
      for (const k of keys) {
        const nestedValue = k.split('.').reduce((obj, k) =>
          (obj && obj[k] !== undefined) ? obj[k] : null, personalInfo);

        if (nestedValue !== null && nestedValue !== undefined && nestedValue !== '' && nestedValue !== 'null') {
          value = nestedValue;
          break;
        }
      }

      // Return default value if no value found
      if (value === null || value === undefined || value === '' || value === 'null') {
        return defaultValue;
      }

      // Apply formatting based on format parameter
      switch (format) {
        case 'date':
          return formatDate(value);
        case 'phone':
          return formatPhone(value);
        default:
          return value.toString().trim();
      }
    } catch (error) {
      console.error(`Error getting field ${key}:`, error);
      return defaultValue;
    }
  };

  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState(null);

  // Handle copy to clipboard
  const handleCopy = (text, fieldKey) => {
    if (!text || text === '-') return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      toast({
        title: 'Tersalin!',
        description: `${fieldKey} berhasil disalin ke clipboard`,
        duration: 2000,
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(err => {
      console.error('Failed to copy text:', err);
      toast({
        title: 'Gagal menyalin',
        description: 'Tidak dapat menyalin teks ke clipboard',
        variant: 'destructive',
      });
    });
  };

  // Field definitions with proper schema
  const fields = [
    {
      label: 'Nama Lengkap',
      key: ['name', 'namaLengkap', 'nama'],
      type: FieldType.TEXT,
      icon: <UserIcon className="w-4 h-4" />,
      colSpan: 2,
      copyable: true,
      defaultValue: 'Tidak Diketahui'
    },
    { 
      label: 'NIP',
      key: 'nip',
      type: FieldType.TEXT,
      icon: <Tag className="w-4 h-4" />,
      copyable: true
    },
    { 
      label: 'Email',
      key: 'email',
      type: FieldType.EMAIL,
      icon: <Mail className="w-4 h-4" />,
      copyable: true
    },
    { 
      label: 'No. Telepon',
      key: 'phone',
      type: FieldType.PHONE,
      icon: <Phone className="w-4 h-4" />,
      copyable: true
    },
    { 
      label: 'Tempat, Tanggal Lahir',
      key: ['tempatLahir', 'tanggalLahir'],
      type: FieldType.CUSTOM,
      icon: <Cake className="w-4 h-4" />,
      colSpan: 2,
      render: (values) => (
        <div className="space-y-1">
          <div>{values.tempatLahir || '-'}</div>
          <div className="text-sm text-muted-foreground">
            {values.tanggalLahir ? formatDate(values.tanggalLahir) : '-'}
          </div>
        </div>
      )
    },
    { 
      label: 'Jenis Kelamin',
      key: 'jenisKelamin',
      type: FieldType.TEXT,
      icon: <UserIcon className="w-4 h-4" />
    },
    { 
      label: 'Status Kepegawaian',
      key: 'statusKepegawaian',
      type: FieldType.TEXT,
      icon: <UserCheckIcon className="w-4 h-4" />
    },
    { 
      label: 'Pangkat/Golongan',
      key: 'pangkatGolongan',
      type: FieldType.TEXT,
      icon: <Award className="w-4 h-4" />
    },
    { 
      label: 'TMT',
      key: 'tmt',
      type: FieldType.DATE,
      icon: <CalendarIcon className="w-4 h-4" />,
      format: 'date'
    },
    { 
      label: 'Jabatan',
      key: 'position',
      type: FieldType.TEXT,
      icon: <Briefcase className="w-4 h-4" />,
      colSpan: 2,
      copyable: true
    },
    { 
      label: 'Unit Kerja',
      key: 'unit',
      type: FieldType.TEXT,
      icon: <Building2 className="w-4 h-4" />,
      colSpan: 2,
      defaultValue: 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
      copyable: true
    },
    { 
      label: 'Pendidikan Terakhir',
      key: 'pendidikanTerakhir',
      type: FieldType.TEXT,
      icon: <Book className="w-4 h-4" />,
      colSpan: 2
    },
    { 
      label: 'Alamat',
      key: 'alamat',
      type: FieldType.TEXT,
      icon: <MapPinIcon className="w-4 h-4" />,
      colSpan: 2,
      copyable: true
    }
  ].map(field => ({
    ...fieldSchema,
    ...field,
    // Ensure key is always an array for consistent handling
    keys: Array.isArray(field.key) ? field.key : [field.key]
  }));

  // Get field value with proper formatting
  const getFieldValue = (field) => {
    try {
      // Handle custom render function
      if (field.render) {
        const values = field.keys.reduce((acc, key) => ({
          ...acc,
          [key]: getField(key, field.defaultValue || '-', field.format)
        }), {});
        return field.render(values);
      }

      // Handle single value
      const value = getField(field.keys[0], field.defaultValue || '-', field.format);
      
      // Format based on type
      switch (field.type) {
        case FieldType.DATE:
          return formatDate(value);
        case FieldType.PHONE:
          return formatPhone(value);
        case FieldType.EMAIL:
          return value;
        default:
          return value;
      }
    } catch (error) {
      console.error(`Error getting value for ${field.label}:`, error);
      return '-';
    }
  };

  // Render field value based on its type
  const renderFieldValue = (field) => {
    const value = getFieldValue(field);
    const isCopied = copiedField === field.key;
    
    // Handle email fields
    if (field.type === FieldType.EMAIL) {
      return (
        <a 
          href={`mailto:${value}`} 
          className="hover:underline inline-flex items-center gap-1 text-blue-500"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </a>
      );
    }
    
    // Handle phone fields
    if (field.type === FieldType.PHONE) {
      return (
        <div className="flex items-center gap-2">
          <a 
            href={`tel:${value}`} 
            className="hover:underline inline-flex items-center gap-1"
          >
            {value}
          </a>
        </div>
      );
    }
    
    // Handle custom rendered fields
    if (field.render) {
      return value;
    }
    
    // Default text field
    return (
      <span className={value === '-' ? 'text-muted-foreground' : ''}>
        {value}
      </span>
    );
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          <span>Informasi Pegawai</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => {
            const value = getFieldValue(field);
            const isCopied = copiedField === field.key;
            
            return (
              <div 
                key={index} 
                className={`space-y-1 ${field.colSpan === 2 ? 'col-span-2' : ''} ${
                  field.copyable ? 'group relative' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {field.icon}
                  <span>{field.label}</span>
                  {field.copyable && value !== '-' && (
                    <button 
                      onClick={() => handleCopy(value, field.label)}
                      className={`transition-opacity ${
                        isCopied 
                          ? 'text-green-500' 
                          : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
                      }`}
                      title={isCopied ? 'Tersalin!' : 'Salin ke clipboard'}
                      disabled={isCopied}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="font-medium pl-6 break-words">
                  {renderFieldValue(field)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmitterInfoCard;

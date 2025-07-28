import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    if (!dateString || dateString === '-' || dateString === '0000-00-00') return 'Belum ada data';
    
    try {
      let date;
      
      // If already a Date object
      if (dateString instanceof Date) {
        date = dateString;
      } 
      // Handle ISO format (e.g., '2025-05-01')
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString);
      }
      // Handle Indonesian date format (e.g., '01 Mei 2025')
      else if (/^\d{1,2} [a-zA-Z]+ \d{4}$/.test(dateString)) {
        const months = {
          'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
          'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
        };
        
        const [day, monthName, year] = dateString.split(' ');
        const monthIndex = months[monthName];
        
        if (monthIndex === undefined) {
          throw new Error('Invalid month name');
        }
        
        date = new Date(year, monthIndex, parseInt(day, 10));
      } 
      // Try parsing as a date string
      else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in SubmitterInfoCard:', dateString);
        return 'Format tanggal tidak valid';
      }
      
      // Format the date in Indonesian locale
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
    } catch (e) {
      console.error('Error formatting date in SubmitterInfoCard:', dateString, e);
      return 'Format tanggal tidak valid';
    }
  };

  // Get field with fallback and formatting
  const getField = (key, defaultValue = '-', format = null) => {
    try {
      // If key is not provided, return default value
      if (!key) return defaultValue;
      
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
        if (!k || k.trim() === '') continue;
        
        try {
          // Handle direct property access
          if (personalInfo[k] !== undefined && personalInfo[k] !== null && personalInfo[k] !== '') {
            value = personalInfo[k];
            if (value !== null && value !== undefined && value !== '') {
              break;
            }
          }
          
          // Handle nested properties with dot notation
          if (typeof k === 'string' && k.includes('.')) {
            const nestedValue = k.split('.').reduce((obj, k) => {
              if (obj === null || obj === undefined) return null;
              return obj[k];
            }, personalInfo);

            if (nestedValue !== null && nestedValue !== undefined && nestedValue !== '' && nestedValue !== 'null') {
              value = nestedValue;
              if (value) break;
            }
          }
        } catch (error) {
          console.warn(`Error accessing field '${k}':`, error);
          continue;
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
    // Section 1: Basic Information
    {
      label: 'Nama Lengkap',
      key: ['name', 'namaLengkap', 'nama'],
      type: FieldType.TEXT,
      icon: <UserIcon className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      copyable: true,
      className: 'border-t border-white/10 pt-4',
      render: (values) => ({
        name: values.name || values.namaLengkap || values.nama || 'Tidak Diketahui',
        className: 'text-lg font-semibold text-white'
      })
    },
    {
      label: 'NIP',
      key: ['nip', 'nomorIndukPegawai'],
      type: FieldType.TEXT,
      icon: <Tag className="w-4 h-4 text-muted-foreground" />,
      copyable: true,
      className: 'pt-1',
      render: (values) => ({
        name: values.nip || values.nomorIndukPegawai || '-',
        className: 'text-sm text-gray-300'
      })
    },
    
    // Section 2: Contact Information
    {
      label: 'Informasi Kontak',
      type: 'section-header',
      colSpan: 2,
      className: 'border-t border-white/10 pt-4 mt-2'
    },
    {
      label: 'Email',
      key: 'email',
      type: FieldType.EMAIL,
      icon: <Mail className="w-4 h-4 text-muted-foreground" />,
      copyable: true,
      className: 'pt-1',
      render: (values) => ({
        name: values.email || '-',
        className: 'text-white'
      })
    },
    {
      label: 'No. Telepon',
      key: ['phone', 'noHp', 'noTelepon'],
      type: FieldType.PHONE,
      icon: <Phone className="w-4 h-4 text-muted-foreground" />,
      copyable: true,
      className: 'pt-1',
      render: (values) => ({
        name: values.phone || values.noHp || values.noTelepon || '-',
        className: 'text-white'
      })
    },
    
    // Section 3: Personal Information
    {
      label: 'Informasi Pribadi',
      type: 'section-header',
      colSpan: 2,
      className: 'border-t border-white/10 pt-4 mt-2'
    },
    { 
      label: 'Tempat, Tanggal Lahir',
      key: ['tempatLahir', 'tanggalLahir'],
      type: FieldType.CUSTOM,
      icon: <Cake className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      className: 'pt-1',
      render: (values) => ({
        name: (
          <div className="space-y-1">
            <div className="text-white">{values.tempatLahir || '-'}</div>
            <div className="text-sm text-gray-300">
              {values.tanggalLahir ? formatDate(values.tanggalLahir) : '-'}
            </div>
          </div>
        ),
        className: ''
      })
    },
    { 
      label: 'Jenis Kelamin',
      key: 'jenisKelamin',
      type: FieldType.TEXT,
      icon: <UserIcon className="w-4 h-4 text-muted-foreground" />,
      className: 'pt-1',
      render: (values) => ({
        name: values.jenisKelamin || '-',
        className: 'text-white'
      })
    },
    
    // Section 4: Employment Information
    {
      label: 'Informasi Kepegawaian',
      type: 'section-header',
      colSpan: 2,
      className: 'border-t border-white/10 pt-4 mt-2'
    },
    { 
      label: 'Status Kepegawaian',
      key: 'statusKepegawaian',
      type: FieldType.TEXT,
      icon: <UserCheckIcon className="w-4 h-4 text-muted-foreground" />,
      className: 'pt-1',
      render: (values) => ({
        name: values.statusKepegawaian || '-',
        className: 'text-white'
      })
    },
    { 
      label: 'Pangkat/Golongan',
      key: 'pangkatGolongan',
      type: FieldType.TEXT,
      icon: <Award className="w-4 h-4 text-muted-foreground" />,
      className: 'pt-1',
      render: (values) => ({
        name: values.pangkatGolongan || '-',
        className: 'text-white'
      })
    },
    { 
      label: 'TMT',
      key: ['tmt', 'tmtJabatan', 'jabatan.tmt'],
      type: FieldType.DATE,
      icon: <CalendarIcon className="w-4 h-4 text-muted-foreground" />,
      className: 'pt-1',
      render: (values) => {
        const tmt = values.tmt || values.tmtJabatan || values['jabatan.tmt'];
        const formattedDate = tmt ? formatDate(tmt) : 'Belum ada data';
        return {
          name: formattedDate === 'Belum ada data' ? (
            <span className="text-gray-400">{formattedDate}</span>
          ) : (
            formattedDate
          ),
          className: 'text-white'
        };
      }
    },
    
    // Section 5: Position Information
    {
      label: 'Informasi Jabatan',
      type: 'section-header',
      colSpan: 2,
      className: 'border-t border-white/10 pt-4 mt-2'
    },
    {
      label: 'Jenis Jabatan',
      key: ['jenisJabatan', 'jabatan.jenis'],
      type: FieldType.TEXT,
      icon: <UserCheck className="w-4 h-4 text-muted-foreground" />,
      className: 'pt-1',
      render: (values) => ({
        name: values.jenisJabatan || values['jabatan.jenis'] || 'Belum ada data',
        className: 'text-white'
      })
    },
    {
      label: 'Jabatan',
      key: ['jabatan', 'position', 'jabatan.nama'],
      type: FieldType.TEXT,
      icon: <Briefcase className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      copyable: true,
      className: 'pt-1',
      render: (values) => ({
        name: values.jabatan?.nama || values.position || 'Belum ada data',
        className: 'text-white'
      })
    },
    {
      label: 'Unit Kerja',
      key: ['unit', 'unitKerja', 'instansi'],
      type: FieldType.TEXT,
      icon: <Building2 className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      copyable: true,
      className: 'pt-1',
      render: (values) => ({
        name: values.unit || values.unitKerja || values.instansi || 'Sekretariat Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas',
        className: 'text-white'
      })
    },
    
    // Section 6: Additional Information
    {
      label: 'Informasi Tambahan',
      type: 'section-header',
      colSpan: 2,
      className: 'border-t border-white/10 pt-4 mt-2'
    },
    { 
      label: 'Pendidikan Terakhir',
      key: 'pendidikanTerakhir',
      type: FieldType.TEXT,
      icon: <Book className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      className: 'pt-1',
      render: (values) => ({
        name: values.pendidikanTerakhir || '-',
        className: 'text-white'
      })
    },
    { 
      label: 'Alamat',
      key: 'alamat',
      type: FieldType.TEXT,
      icon: <MapPinIcon className="w-4 h-4 text-muted-foreground" />,
      colSpan: 2,
      copyable: true,
      className: 'pt-1 pb-2',
      render: (values) => ({
        name: values.alamat || '-',
        className: 'text-white whitespace-pre-line'
      })
    }
  ].map(field => ({
    ...fieldSchema,
    ...field,
    // Ensure key is always an array for consistent handling
    keys: Array.isArray(field.key) ? field.key : [field.key]
  }));

  // Get field value with proper formatting
  const getFieldValue = (field) => {
    if (!field) return '-';
    
    try {
      // If field has a direct value, return it
      if ('value' in field) {
        return field.value !== undefined ? field.value : '-';
      }
      
      // Get the raw field value
      const value = getField(field.key, field.defaultValue, field.format);
      
      // If we have a value, format it based on type
      if (value && value !== '-') {
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
      }
      
      // If we have a render function, use it with the personalInfo
      if (field.render) {
        const rendered = field.render(personalInfo || {});
        if (rendered !== undefined && rendered !== null) {
          return rendered;
        }
      }
      
      // Return default value if nothing else works
      return field.defaultValue || '-';
    } catch (error) {
      console.error(`Error getting value for ${field.label}:`, error);
      return '-';
    }
  };

  // Render field value based on its type
  const renderFieldValue = (field) => {
    // Handle section headers first
    if (field.type === 'section-header') {
      return (
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {field.label}
        </h3>
      );
    }
    
    // Get the raw value for this field
    const value = getFieldValue(field);
    const isCopied = copiedField === field.key;
    
    // Handle custom rendered fields
    if (field.render) {
      try {
        const rendered = field.render(personalInfo || {});
        
        // If render returns an object with name and className
        if (rendered && typeof rendered === 'object' && 'name' in rendered) {
          return (
            <div className={rendered.className || ''}>
              {rendered.name}
            </div>
          );
        }
        
        // If render returns a React element or string directly
        return rendered || <span className="text-gray-400">-</span>;
      } catch (error) {
        console.error('Error rendering field:', field.label, error);
        return <span className="text-gray-400">-</span>;
      }
    }
    
    // Handle empty values
    if (!value || value === '-' || value === 'Belum ada data') {
      return <span className="text-gray-400">-</span>;
    }
    
    // Handle email fields
    if (field.type === FieldType.EMAIL) {
      return (
        <a 
          href={`mailto:${value}`} 
          className="hover:underline inline-flex items-center gap-1 text-blue-300 font-medium hover:text-blue-200"
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
            className="hover:underline inline-flex items-center gap-1 font-medium text-white hover:text-gray-200"
          >
            {value}
          </a>
        </div>
      );
    }
    
    // Default text field
    return <span className="text-white">{value}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            <span>Informasi Pegawai</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => {
              const value = getFieldValue(field);
              const isCopied = copiedField === field.key;
              
              // Skip rendering if this is a section header without a value
              if (field.type === 'section-header' && !value) {
                return null;
              }
              
              return (
                <div 
                  key={index} 
                  className={`${field.className || ''} ${
                    field.colSpan === 2 ? 'col-span-2' : ''
                  } ${field.copyable ? 'group relative' : ''}`}
                >
                  {field.type !== 'section-header' && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {field.icon}
                      <span>{field.label}</span>
                      {field.copyable && value !== '-' && value !== 'Belum ada data' && (
                        <button 
                          onClick={() => handleCopy(value, field.label)}
                          className={`transition-opacity ${
                            isCopied 
                              ? 'text-green-400' 
                              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white'
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
                  )}
                  <div className={`${field.type !== 'section-header' ? 'pl-6 mt-0.5' : ''} break-words`}>
                    {renderFieldValue(field)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubmitterInfoCard;

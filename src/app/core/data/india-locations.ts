export interface DistrictOption {
  name: string;
  talukas: string[];
}

export interface StateOption {
  name: string;
  districts: DistrictOption[];
}

export const INDIA_LOCATIONS: StateOption[] = [
  {
    name: 'Maharashtra',
    districts: [
      { name: 'Beed', talukas: ['Beed', 'Ashti', 'Georai', 'Kaij', 'Ambajogai', 'Patoda', 'Shirur (Kasar)', 'Parli', 'Majalgaon', 'Wadwani', 'Dharur'] },
      { name: 'Pune', talukas: ['Pune City', 'Haveli', 'Baramati', 'Indapur', 'Daund', 'Shirur', 'Junnar', 'Ambegaon', 'Khed', 'Maval', 'Mulshi', 'Velhe', 'Bhor', 'Purandar'] },
      { name: 'Aurangabad', talukas: ['Aurangabad', 'Gangapur', 'Vaijapur', 'Kannad', 'Sillod', 'Soegaon', 'Phulambri', 'Paithan', 'Khuldabad'] },
      { name: 'Nashik', talukas: ['Nashik', 'Niphad', 'Sinnar', 'Igatpuri', 'Trimbakeshwar', 'Dindori', 'Yeola', 'Chandwad', 'Malegaon', 'Baglan', 'Nandgaon'] },
      { name: 'Latur', talukas: ['Latur', 'Ausa', 'Nilanga', 'Udgir', 'Ahmedpur', 'Chakur', 'Renapur', 'Jalkot', 'Deoni', 'Shirur Anantpal'] },
      { name: 'Solapur', talukas: ['Solapur North', 'Solapur South', 'Barshi', 'Pandharpur', 'Karmala', 'Madha', 'Mohol', 'Akkalkot'] },
      { name: 'Mumbai City', talukas: ['Mumbai City'] },
      { name: 'Nagpur', talukas: ['Nagpur (Urban)', 'Nagpur (Rural)', 'Kamptee', 'Hingna', 'Katol', 'Narkhed'] },
    ],
  },
  { name: 'Karnataka', districts: [{ name: 'Bangalore Urban', talukas: [] }, { name: 'Belagavi', talukas: [] }, { name: 'Mysuru', talukas: [] }] },
  { name: 'Gujarat', districts: [{ name: 'Ahmedabad', talukas: [] }, { name: 'Surat', talukas: [] }, { name: 'Vadodara', talukas: [] }] },
  { name: 'Madhya Pradesh', districts: [{ name: 'Bhopal', talukas: [] }, { name: 'Indore', talukas: [] }, { name: 'Jabalpur', talukas: [] }] },
  { name: 'Telangana', districts: [{ name: 'Hyderabad', talukas: [] }, { name: 'Warangal', talukas: [] }] },
  { name: 'Andhra Pradesh', districts: [{ name: 'Visakhapatnam', talukas: [] }, { name: 'Vijayawada', talukas: [] }] },
  { name: 'Rajasthan', districts: [{ name: 'Jaipur', talukas: [] }, { name: 'Jodhpur', talukas: [] }] },
  { name: 'Uttar Pradesh', districts: [{ name: 'Lucknow', talukas: [] }, { name: 'Kanpur', talukas: [] }] },
  { name: 'Punjab', districts: [{ name: 'Ludhiana', talukas: [] }, { name: 'Amritsar', talukas: [] }] },
  { name: 'Haryana', districts: [{ name: 'Gurugram', talukas: [] }, { name: 'Faridabad', talukas: [] }] },
];
import { PlotRecord, User, UserRole } from '../types';

// Mock Users
export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@cidco.com', role: UserRole.ADMIN, name: 'System Admin' },
  { id: '2', username: 'demo', email: 'demo@cidco.com', role: UserRole.USER, name: 'Demo User' },
];

// Mock Records
export const MOCK_RECORDS: PlotRecord[] = [
  {
    ID: '101',
    NAME_OF_NODE: 'PANVEL EAST',
    SECTOR_NO_: '12',
    BLOCK_ROAD_NAME: 'Block A',
    PLOT_NO_: '55',
    PLOT_NO_AFTER_SURVEY: '55/A',
    SUB_PLOT_NO_: '',
    UID: 'UID-2023-001',
    DATE_OF_ALLOTMENT: '2010-05-15',
    NAME_OF_ORIGINAL_ALLOTTEE: 'John Doe',
    PLOT_AREA_SQM_: '500.00',
    PLOT_AREA_FOR_INVOICE: '500.00',
    PLOT_USE_FOR_INVOICE: 'RESIDENTIAL',
    USE_OF_PLOT: 'RESIDENTIAL',
    images: ['https://picsum.photos/800/600', 'https://picsum.photos/800/601'],
    has_pdf: true,
    has_map: false
  },
  {
    ID: '102',
    NAME_OF_NODE: 'PANVEL EAST',
    SECTOR_NO_: '12',
    BLOCK_ROAD_NAME: 'Block B',
    PLOT_NO_: '12',
    PLOT_NO_AFTER_SURVEY: '12',
    SUB_PLOT_NO_: '',
    UID: 'UID-2023-002',
    DATE_OF_ALLOTMENT: '2012-08-20',
    NAME_OF_ORIGINAL_ALLOTTEE: 'Jane Smith',
    PLOT_AREA_SQM_: '1200.00',
    PLOT_AREA_FOR_INVOICE: '1200.00',
    PLOT_USE_FOR_INVOICE: 'COMMERCIAL',
    USE_OF_PLOT: 'COMMERCIAL',
    images: [],
    has_pdf: false,
    has_map: true
  },
  {
    ID: '103',
    NAME_OF_NODE: 'AIROLI',
    SECTOR_NO_: '5',
    BLOCK_ROAD_NAME: 'Road 3',
    PLOT_NO_: '7',
    PLOT_NO_AFTER_SURVEY: '7',
    SUB_PLOT_NO_: '',
    UID: 'UID-2023-003',
    DATE_OF_ALLOTMENT: '2015-01-10',
    NAME_OF_ORIGINAL_ALLOTTEE: 'Acme Corp',
    PLOT_AREA_SQM_: '2500.00',
    PLOT_AREA_FOR_INVOICE: '2500.00',
    PLOT_USE_FOR_INVOICE: 'INDUSTRIAL',
    USE_OF_PLOT: 'INDUSTRIAL',
    images: ['https://picsum.photos/800/602'],
    has_pdf: true,
    has_map: true
  }
];
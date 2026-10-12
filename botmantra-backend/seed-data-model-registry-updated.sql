-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA MODEL REGISTRY - SEED DATA FOR SAP MODULES (UPDATED)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Matches actual table structure with 32 columns
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Optional: Clear existing test data
-- DELETE FROM data_model_registry WHERE module IN ('CLIENT', 'PROFILE', 'COMPANY', 'SD', 'MM', 'FICO', 'INVENTORY', 'BASIC');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CLIENT MODULE - Company Code Master (T001)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code, validation_rule
) VALUES
('CLIENT', 'T001', 'BUKRS', 'VARCHAR(4)', 'Company Code', 'Company Code', 'text_input', 'text', 'identification', 'Unique 4-character company code', 1, false, true, true, true, true, true, true, false, 'company_master', '^[A-Z0-9]{4}$'),
('CLIENT', 'T001', 'BUTXT', 'VARCHAR(25)', 'Company Name', 'Name', 'text_input', 'text', 'basic_info', 'Full company name', 2, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'ORT01', 'VARCHAR(25)', 'City', 'City', 'text_input', 'text', 'address', 'City location', 3, true, false, false, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'LAND1', 'VARCHAR(3)', 'Country Key', 'Country', 'dropdown', 'select', 'address', 'ISO country code', 4, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'WAERS', 'VARCHAR(5)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Company currency', 5, false, false, true, true, true, true, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'SPRAS', 'VARCHAR(1)', 'Language', 'Language', 'dropdown', 'select', 'settings', 'Default language', 6, false, false, true, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'KTOPL', 'VARCHAR(4)', 'Chart of Accounts', 'COA', 'text_input', 'text', 'financial', 'Chart of accounts', 7, true, false, false, true, false, false, true, false, 'company_master', NULL),
('CLIENT', 'T001', 'KOKRS', 'VARCHAR(4)', 'Controlling Area', 'CO Area', 'text_input', 'text', 'controlling', 'Controlling area', 9, true, false, false, true, false, false, true, false, 'company_master', NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PROFILE MODULE - User Profile Master
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('PROFILE', 'USER_PROFILE', 'USER_ID', 'UUID', 'User ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique user identifier', 1, false, true, true, false, false, false, true, true, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'USERNAME', 'VARCHAR(100)', 'Username', 'Username', 'text_input', 'text', 'basic_info', 'Login username', 2, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'EMAIL', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'basic_info', 'Email address', 3, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'FIRST_NAME', 'VARCHAR(100)', 'First Name', 'First Name', 'text_input', 'text', 'basic_info', 'First name', 4, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'LAST_NAME', 'VARCHAR(100)', 'Last Name', 'Last Name', 'text_input', 'text', 'basic_info', 'Last name', 5, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'PHONE', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Contact phone', 6, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'AVATAR', 'TEXT', 'Avatar', 'Photo', 'image_upload', 'file', 'media', 'Profile picture', 7, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'BIO', 'TEXT', 'Bio', 'Bio', 'textarea', 'textarea', 'additional', 'User biography', 8, true, false, false, true, false, false, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'COMPANY_ID', 'UUID', 'Company', 'Company', 'dropdown', 'select', 'organization', 'Company reference', 9, true, false, false, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'DEPARTMENT', 'VARCHAR(100)', 'Department', 'Department', 'text_input', 'text', 'organization', 'Department name', 10, true, false, false, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'ROLE', 'VARCHAR(50)', 'Role', 'Role', 'dropdown', 'select', 'permissions', 'User role', 11, false, false, true, true, true, true, true, false, 'user_profile'),
('PROFILE', 'USER_PROFILE', 'STATUS', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active status', 12, false, false, true, true, true, true, true, false, 'user_profile');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. COMPANY MODULE - Company Master Data
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code, validation_rule
) VALUES
('COMPANY', 'COMPANY', 'COMPANY_ID', 'UUID', 'Company ID', 'ID', 'hidden', 'hidden', 'identification', 'Unique identifier', 1, false, true, true, false, false, false, true, true, 'company_master', NULL),
('COMPANY', 'COMPANY', 'COMPANY_CODE', 'VARCHAR(10)', 'Company Code', 'Code', 'text_input', 'text', 'identification', 'Company code', 2, false, false, true, true, true, true, true, false, 'company_master', '^[A-Z0-9]{2,10}$'),
('COMPANY', 'COMPANY', 'COMPANY_NAME', 'VARCHAR(255)', 'Company Name', 'Name', 'text_input', 'text', 'basic_info', 'Company name', 3, false, false, true, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'LEGAL_NAME', 'VARCHAR(255)', 'Legal Name', 'Legal Name', 'text_input', 'text', 'basic_info', 'Legal name', 4, true, false, false, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'INDUSTRY', 'VARCHAR(100)', 'Industry', 'Industry', 'dropdown', 'select', 'classification', 'Industry sector', 5, true, false, false, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'COMPANY_SIZE', 'VARCHAR(50)', 'Size', 'Size', 'dropdown', 'select', 'classification', 'Company size', 6, true, false, false, true, true, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'REGISTRATION_NO', 'VARCHAR(50)', 'Registration No', 'Reg. No.', 'text_input', 'text', 'legal', 'Registration number', 7, true, false, false, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'TAX_ID', 'VARCHAR(50)', 'Tax ID', 'Tax ID', 'text_input', 'text', 'legal', 'Tax ID number', 8, true, false, false, true, false, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'WEBSITE', 'VARCHAR(255)', 'Website', 'Website', 'url_input', 'url', 'contact', 'Company website', 9, true, false, false, true, false, false, true, false, 'company_master', '^https?://'),
('COMPANY', 'COMPANY', 'EMAIL', 'VARCHAR(255)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Company email', 10, true, false, false, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'PHONE', 'VARCHAR(20)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Phone number', 11, true, false, false, true, false, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'ADDRESS_LINE1', 'VARCHAR(255)', 'Address 1', 'Address', 'text_input', 'text', 'address', 'Street address', 12, true, false, false, true, false, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'CITY', 'VARCHAR(100)', 'City', 'City', 'text_input', 'text', 'address', 'City', 14, true, false, false, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'STATE', 'VARCHAR(100)', 'State', 'State', 'text_input', 'text', 'address', 'State/Province', 15, true, false, false, true, true, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'POSTAL_CODE', 'VARCHAR(20)', 'Postal Code', 'Zip', 'text_input', 'text', 'address', 'Postal code', 16, true, false, false, true, false, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'COUNTRY', 'VARCHAR(3)', 'Country', 'Country', 'dropdown', 'select', 'address', 'Country code', 17, false, false, true, true, true, true, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'CURRENCY', 'VARCHAR(3)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Base currency', 18, false, false, true, true, true, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'LOGO_URL', 'TEXT', 'Logo', 'Logo', 'image_upload', 'file', 'branding', 'Company logo', 20, true, false, false, true, false, false, true, false, 'company_master', NULL),
('COMPANY', 'COMPANY', 'STATUS', 'VARCHAR(20)', 'Status', 'Status', 'toggle', 'checkbox', 'status', 'Active status', 21, false, false, true, true, true, true, true, false, 'company_master', NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SD MODULE - Customer Master (KNA1)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('SD', 'KNA1', 'KUNNR', 'VARCHAR(10)', 'Customer Number', 'Customer #', 'text_input', 'text', 'identification', 'Customer number', 1, false, true, true, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'NAME1', 'VARCHAR(35)', 'Name 1', 'Name', 'text_input', 'text', 'basic_info', 'Customer name', 2, false, false, true, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'NAME2', 'VARCHAR(35)', 'Name 2', 'Name 2', 'text_input', 'text', 'basic_info', 'Additional name', 3, true, false, false, true, false, false, true, false, 'customer_master'),
('SD', 'KNA1', 'SORTL', 'VARCHAR(10)', 'Search Term', 'Search', 'text_input', 'text', 'search', 'Search term', 4, true, false, false, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'STRAS', 'VARCHAR(35)', 'Street', 'Street', 'text_input', 'text', 'address', 'Street address', 5, true, false, false, true, false, false, true, false, 'customer_master'),
('SD', 'KNA1', 'ORT01', 'VARCHAR(35)', 'City', 'City', 'text_input', 'text', 'address', 'City', 6, true, false, false, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'PSTLZ', 'VARCHAR(10)', 'Postal Code', 'Postal', 'text_input', 'text', 'address', 'Postal code', 7, true, false, false, true, false, false, true, false, 'customer_master'),
('SD', 'KNA1', 'LAND1', 'VARCHAR(3)', 'Country', 'Country', 'dropdown', 'select', 'address', 'Country key', 8, false, false, true, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'TELF1', 'VARCHAR(16)', 'Phone', 'Phone', 'phone_input', 'tel', 'contact', 'Telephone', 10, true, false, false, true, false, false, true, false, 'customer_master'),
('SD', 'KNA1', 'SMTP_ADDR', 'VARCHAR(241)', 'Email', 'Email', 'email_input', 'email', 'contact', 'Email address', 12, true, false, false, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'KTOKD', 'VARCHAR(4)', 'Account Group', 'Group', 'dropdown', 'select', 'classification', 'Account group', 13, false, false, true, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'BRSCH', 'VARCHAR(4)', 'Industry', 'Industry', 'dropdown', 'select', 'classification', 'Industry sector', 14, true, false, false, true, true, true, true, false, 'customer_master'),
('SD', 'KNA1', 'STCEG', 'VARCHAR(20)', 'VAT Number', 'VAT', 'text_input', 'text', 'tax', 'VAT number', 15, true, false, false, true, false, false, true, false, 'customer_master');

-- SD: Sales Order Header (VBAK)
INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('SD', 'VBAK', 'VBELN', 'VARCHAR(10)', 'Sales Document', 'Doc #', 'text_input', 'text', 'identification', 'Sales doc number', 1, false, true, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'ERDAT', 'DATE', 'Creation Date', 'Date', 'date_picker', 'date', 'dates', 'Creation date', 2, false, false, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'AUART', 'VARCHAR(4)', 'Order Type', 'Type', 'dropdown', 'select', 'classification', 'Order type', 3, false, false, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'VKORG', 'VARCHAR(4)', 'Sales Org', 'Org', 'dropdown', 'select', 'organization', 'Sales organization', 4, false, false, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'VTWEG', 'VARCHAR(2)', 'Distribution Channel', 'Channel', 'dropdown', 'select', 'organization', 'Dist. channel', 5, false, false, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'KUNNR', 'VARCHAR(10)', 'Customer', 'Customer', 'text_input', 'text', 'customer', 'Customer number', 7, false, false, true, true, true, true, true, false, 'sales_order'),
('SD', 'VBAK', 'WAERK', 'VARCHAR(5)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Currency', 8, false, false, true, true, true, false, true, false, 'sales_order'),
('SD', 'VBAK', 'NETWR', 'DECIMAL(15,2)', 'Net Value', 'Net Value', 'number_input', 'number', 'financial', 'Net order value', 11, true, false, false, true, false, true, true, false, 'sales_order');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. MM MODULE - Material Master (MARA) & Purchase Order (EKKO)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('MM', 'MARA', 'MATNR', 'VARCHAR(18)', 'Material Number', 'Material #', 'text_input', 'text', 'identification', 'Material number', 1, false, true, true, true, true, true, true, false, 'material_master'),
('MM', 'MARA', 'MAKTX', 'VARCHAR(40)', 'Description', 'Description', 'text_input', 'text', 'basic_info', 'Material desc', 2, false, false, true, true, true, true, true, false, 'material_master'),
('MM', 'MARA', 'MTART', 'VARCHAR(4)', 'Material Type', 'Type', 'dropdown', 'select', 'classification', 'Material type', 3, false, false, true, true, true, true, true, false, 'material_master'),
('MM', 'MARA', 'MEINS', 'VARCHAR(3)', 'Base UoM', 'UoM', 'dropdown', 'select', 'units', 'Base unit', 5, false, false, true, true, true, false, true, false, 'material_master'),
('MM', 'MARA', 'MATKL', 'VARCHAR(9)', 'Material Group', 'Group', 'dropdown', 'select', 'classification', 'Material group', 6, true, false, false, true, true, true, true, false, 'material_master'),
('MM', 'MARA', 'BRGEW', 'DECIMAL(13,3)', 'Gross Weight', 'Gross Wt', 'number_input', 'number', 'physical', 'Gross weight', 8, true, false, false, true, false, false, true, false, 'material_master'),
('MM', 'MARA', 'NTGEW', 'DECIMAL(13,3)', 'Net Weight', 'Net Wt', 'number_input', 'number', 'physical', 'Net weight', 9, true, false, false, true, false, false, true, false, 'material_master'),
('MM', 'MARA', 'VOLUM', 'DECIMAL(13,3)', 'Volume', 'Volume', 'number_input', 'number', 'physical', 'Volume', 11, true, false, false, true, false, false, true, false, 'material_master');

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('MM', 'EKKO', 'EBELN', 'VARCHAR(10)', 'Purchase Order', 'PO #', 'text_input', 'text', 'identification', 'PO number', 1, false, true, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'BUKRS', 'VARCHAR(4)', 'Company Code', 'Co Code', 'dropdown', 'select', 'organization', 'Company code', 2, false, false, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'BSART', 'VARCHAR(4)', 'Document Type', 'Type', 'dropdown', 'select', 'classification', 'PO type', 4, false, false, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'AEDAT', 'DATE', 'Creation Date', 'Date', 'date_picker', 'date', 'dates', 'Created date', 5, false, false, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'LIFNR', 'VARCHAR(10)', 'Vendor', 'Vendor', 'text_input', 'text', 'vendor', 'Vendor number', 6, true, false, false, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'EKORG', 'VARCHAR(4)', 'Purch. Org', 'Org', 'dropdown', 'select', 'organization', 'Purchasing org', 7, false, false, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'EKGRP', 'VARCHAR(3)', 'Purch. Group', 'Group', 'dropdown', 'select', 'organization', 'Purch group', 8, false, false, true, true, true, true, true, false, 'purchase_order'),
('MM', 'EKKO', 'WAERS', 'VARCHAR(5)', 'Currency', 'Currency', 'dropdown', 'select', 'financial', 'Currency', 9, false, false, true, true, true, false, true, false, 'purchase_order');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. FICO MODULE - GL Account (SKA1) & Accounting Doc (BSEG)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('FICO', 'SKA1', 'KTOPL', 'VARCHAR(4)', 'Chart of Accounts', 'COA', 'text_input', 'text', 'identification', 'Chart of accounts', 1, false, true, true, true, true, true, true, false, 'gl_account'),
('FICO', 'SKA1', 'SAKNR', 'VARCHAR(10)', 'GL Account', 'Account #', 'text_input', 'text', 'identification', 'GL account', 2, false, true, true, true, true, true, true, false, 'gl_account'),
('FICO', 'SKA1', 'TXT20', 'VARCHAR(20)', 'Short Text', 'Short Text', 'text_input', 'text', 'description', 'Short desc', 3, true, false, false, true, true, true, true, false, 'gl_account'),
('FICO', 'SKA1', 'TXT50', 'VARCHAR(50)', 'Long Text', 'Long Text', 'text_input', 'text', 'description', 'Long desc', 4, true, false, false, true, true, true, true, false, 'gl_account'),
('FICO', 'SKA1', 'KTOKS', 'VARCHAR(4)', 'Account Group', 'Group', 'dropdown', 'select', 'classification', 'Account group', 5, false, false, true, true, true, true, true, false, 'gl_account'),
('FICO', 'SKA1', 'XBILK', 'VARCHAR(1)', 'Balance Sheet', 'B/S', 'toggle', 'checkbox', 'properties', 'Balance sheet ind', 6, true, false, false, true, true, false, true, false, 'gl_account');

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('FICO', 'BSEG', 'BUKRS', 'VARCHAR(4)', 'Company Code', 'Co Code', 'dropdown', 'select', 'identification', 'Company code', 1, false, true, true, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'BELNR', 'VARCHAR(10)', 'Document Number', 'Doc #', 'text_input', 'text', 'identification', 'Doc number', 2, false, true, true, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'GJAHR', 'VARCHAR(4)', 'Fiscal Year', 'Year', 'number_input', 'number', 'identification', 'Fiscal year', 3, false, true, true, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'BUZEI', 'VARCHAR(3)', 'Line Item', 'Line', 'number_input', 'number', 'identification', 'Line item', 4, false, true, true, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'KOART', 'VARCHAR(1)', 'Account Type', 'Type', 'dropdown', 'select', 'classification', 'Account type', 5, false, false, true, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'HKONT', 'VARCHAR(10)', 'GL Account', 'GL', 'text_input', 'text', 'account', 'GL account', 6, true, false, false, true, true, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'DMBTR', 'DECIMAL(23,2)', 'Amount LC', 'Amount', 'number_input', 'number', 'amounts', 'Amount local curr', 7, true, false, false, true, false, true, true, false, 'accounting_doc'),
('FICO', 'BSEG', 'SHKZG', 'VARCHAR(1)', 'Debit/Credit', 'D/C', 'dropdown', 'select', 'posting', 'Debit/Credit', 9, false, false, true, true, true, false, true, false, 'accounting_doc');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. INVENTORY MODULE - Storage Location (MARD) & Stock Movement
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('INVENTORY', 'MARD', 'MATNR', 'VARCHAR(18)', 'Material', 'Material #', 'text_input', 'text', 'identification', 'Material number', 1, false, true, true, true, true, true, true, false, 'stock_data'),
('INVENTORY', 'MARD', 'WERKS', 'VARCHAR(4)', 'Plant', 'Plant', 'dropdown', 'select', 'location', 'Plant', 2, false, true, true, true, true, true, true, false, 'stock_data'),
('INVENTORY', 'MARD', 'LGORT', 'VARCHAR(4)', 'Storage Location', 'Loc', 'dropdown', 'select', 'location', 'Storage location', 3, false, true, true, true, true, true, true, false, 'stock_data'),
('INVENTORY', 'MARD', 'LABST', 'DECIMAL(13,3)', 'Unrestricted Stock', 'Unres', 'number_input', 'number', 'quantities', 'Unrestricted stock', 4, true, false, false, true, false, true, true, false, 'stock_data'),
('INVENTORY', 'MARD', 'INSME', 'DECIMAL(13,3)', 'QI Stock', 'QI', 'number_input', 'number', 'quantities', 'Quality insp stock', 5, true, false, false, true, false, true, true, false, 'stock_data'),
('INVENTORY', 'MARD', 'SPEME', 'DECIMAL(13,3)', 'Blocked Stock', 'Blocked', 'number_input', 'number', 'quantities', 'Blocked stock', 6, true, false, false, true, false, true, true, false, 'stock_data');

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('INVENTORY', 'STOCK_MOVEMENT', 'MOVEMENT_ID', 'UUID', 'Movement ID', 'ID', 'hidden', 'hidden', 'identification', 'Movement ID', 1, false, true, true, false, false, false, true, true, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'MATERIAL_ID', 'UUID', 'Material', 'Material', 'dropdown', 'select', 'material', 'Material ref', 2, false, false, true, true, true, true, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'MOVEMENT_TYPE', 'VARCHAR(3)', 'Movement Type', 'Type', 'dropdown', 'select', 'classification', 'Movement type', 3, false, false, true, true, true, true, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'QUANTITY', 'DECIMAL(13,3)', 'Quantity', 'Qty', 'number_input', 'number', 'quantity', 'Quantity', 4, false, false, true, true, false, true, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'UNIT', 'VARCHAR(3)', 'Unit', 'Unit', 'dropdown', 'select', 'quantity', 'Unit of measure', 5, false, false, true, true, false, false, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'FROM_LOCATION', 'VARCHAR(10)', 'From', 'From', 'dropdown', 'select', 'location', 'Source location', 6, true, false, false, true, true, false, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'TO_LOCATION', 'VARCHAR(10)', 'To', 'To', 'dropdown', 'select', 'location', 'Dest location', 7, true, false, false, true, true, false, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'MOVEMENT_DATE', 'DATE', 'Date', 'Date', 'date_picker', 'date', 'dates', 'Movement date', 8, false, false, true, true, true, true, true, false, 'stock_movement'),
('INVENTORY', 'STOCK_MOVEMENT', 'REFERENCE_DOC', 'VARCHAR(20)', 'Reference', 'Ref Doc', 'text_input', 'text', 'reference', 'Reference doc', 9, true, false, false, true, true, false, true, false, 'stock_movement');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. BASIC TABLES - Countries, Plants, Currencies
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('BASIC', 'T005', 'LAND1', 'VARCHAR(3)', 'Country Key', 'Code', 'text_input', 'text', 'identification', 'Country code', 1, false, true, true, true, true, true, true, false, 'countries'),
('BASIC', 'T005', 'LANDX', 'VARCHAR(15)', 'Country Name', 'Name', 'text_input', 'text', 'description', 'Country name', 2, false, false, true, true, true, true, true, false, 'countries'),
('BASIC', 'T005', 'NATIO', 'VARCHAR(15)', 'Nationality', 'Nationality', 'text_input', 'text', 'description', 'Nationality', 3, true, false, false, true, false, false, true, false, 'countries'),
('BASIC', 'T005', 'INTCA', 'VARCHAR(3)', 'ISO Code', 'ISO', 'text_input', 'text', 'identification', 'ISO 3166 code', 5, true, false, false, true, true, false, true, false, 'countries');

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('BASIC', 'T001W', 'WERKS', 'VARCHAR(4)', 'Plant', 'Plant', 'text_input', 'text', 'identification', 'Plant code', 1, false, true, true, true, true, true, true, false, 'plant_master'),
('BASIC', 'T001W', 'NAME1', 'VARCHAR(30)', 'Name', 'Name', 'text_input', 'text', 'basic_info', 'Plant name', 2, false, false, true, true, true, true, true, false, 'plant_master'),
('BASIC', 'T001W', 'BWKEY', 'VARCHAR(4)', 'Valuation Area', 'Val Area', 'text_input', 'text', 'accounting', 'Valuation area', 3, false, false, true, true, false, false, true, false, 'plant_master'),
('BASIC', 'T001W', 'LAND1', 'VARCHAR(3)', 'Country', 'Country', 'dropdown', 'select', 'location', 'Country', 4, false, false, true, true, true, true, true, false, 'plant_master'),
('BASIC', 'T001W', 'ORT01', 'VARCHAR(25)', 'City', 'City', 'text_input', 'text', 'address', 'City', 7, true, false, false, true, true, true, true, false, 'plant_master');

INSERT INTO data_model_registry (
  module, table_name, column_name, data_type, display_name, ui_label, ui_component, input_type,
  category, description, display_order, is_nullable, is_primary_key, is_required, is_visible, 
  is_filterable, is_sortable, is_active, is_system, template_code
) VALUES
('BASIC', 'TCURC', 'WAERS', 'VARCHAR(5)', 'Currency', 'Code', 'text_input', 'text', 'identification', 'Currency code', 1, false, true, true, true, true, true, true, false, 'currencies'),
('BASIC', 'TCURC', 'LTEXT', 'VARCHAR(40)', 'Long Text', 'Name', 'text_input', 'text', 'description', 'Currency name', 2, false, false, true, true, true, true, true, false, 'currencies'),
('BASIC', 'TCURC', 'KTEXT', 'VARCHAR(20)', 'Short Text', 'Short Name', 'text_input', 'text', 'description', 'Short name', 3, true, false, false, true, false, false, true, false, 'currencies'),
('BASIC', 'TCURC', 'ISOCD', 'VARCHAR(3)', 'ISO Code', 'ISO', 'text_input', 'text', 'identification', 'ISO code', 4, true, false, false, true, true, false, true, false, 'currencies');

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLETION SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  total_records INTEGER;
  by_module RECORD;
  by_table RECORD;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO total_records FROM data_model_registry;
  
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DATA MODEL REGISTRY SEED COMPLETE';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total Records Inserted: %', total_records;
  RAISE NOTICE '';
  
  -- Count by module
  RAISE NOTICE 'Records by Module:';
  FOR by_module IN 
    SELECT module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY module 
    ORDER BY module
  LOOP
    RAISE NOTICE '  • % : % fields', by_module.module, by_module.count;
  END LOOP;
  
  RAISE NOTICE '';
  
  -- Count by table
  RAISE NOTICE 'Records by Table:';
  FOR by_table IN 
    SELECT table_name, module, COUNT(*) as count 
    FROM data_model_registry 
    GROUP BY table_name, module
    ORDER BY module, table_name
  LOOP
    RAISE NOTICE '  • % (%) : % fields', by_table.table_name, by_table.module, by_table.count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  CLIENT: T001 (Company Code)';
  RAISE NOTICE '  PROFILE: USER_PROFILE';
  RAISE NOTICE '  COMPANY: COMPANY (Master)';
  RAISE NOTICE '  SD: KNA1 (Customer), VBAK (Sales Order)';
  RAISE NOTICE '  MM: MARA (Material), EKKO (Purchase Order)';
  RAISE NOTICE '  FICO: SKA1 (GL Account), BSEG (Accounting Doc)';
  RAISE NOTICE '  INVENTORY: MARD (Stock), STOCK_MOVEMENT';
  RAISE NOTICE '  BASIC: T005 (Countries), T001W (Plants), TCURC (Currencies)';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Ready for UI generation and data entry!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;

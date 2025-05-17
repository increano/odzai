import { NextResponse } from 'next/server';

/**
 * Get banks available in a specific country
 * GET /api/gocardless/banks?country=XX
 */
export async function GET(request: Request) {
  try {
    // Get country parameter from query
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    
    if (!country) {
      return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
    }
    
    // Comprehensive data based on GoCardless Bank Account Data Coverage
    const banksByCountry: Record<string, any[]> = {
      'AT': [
        { id: 'ERSTE_AT', name: 'Erste Bank und Sparkassen', logo: 'https://cdn.gocardless.com/icons/ERSTE_AT.png' },
        { id: 'RAIFFEISEN_AT', name: 'Raiffeisen Bank', logo: 'https://cdn.gocardless.com/icons/RAIFFEISEN_AT.png' },
        { id: 'BAWAG_AT', name: 'BAWAG P.S.K.', logo: 'https://cdn.gocardless.com/icons/BAWAG_AT.png' },
        { id: 'BANK_AUSTRIA_AT', name: 'Bank Austria', logo: 'https://cdn.gocardless.com/icons/BANK_AUSTRIA_AT.png' },
        { id: 'VOLKSBANK_AT', name: 'Volksbank', logo: 'https://cdn.gocardless.com/icons/VOLKSBANK_AT.png' }
      ],
      'BE': [
        { id: 'KBC_BE', name: 'KBC Bank', logo: 'https://cdn.gocardless.com/icons/KBC_BE.png' },
        { id: 'BNP_PARIBAS_FORTIS_BE', name: 'BNP Paribas Fortis', logo: 'https://cdn.gocardless.com/icons/BNP_FORTIS_BE.png' },
        { id: 'ING_BE', name: 'ING Belgium', logo: 'https://cdn.gocardless.com/icons/ING_BE.png' },
        { id: 'BELFIUS_BE', name: 'Belfius Bank', logo: 'https://cdn.gocardless.com/icons/BELFIUS_BE.png' },
        { id: 'ARGENTA_BE', name: 'Argenta', logo: 'https://cdn.gocardless.com/icons/ARGENTA_BE.png' },
        { id: 'AXA_BANK_BE', name: 'AXA Bank', logo: 'https://cdn.gocardless.com/icons/AXA_BANK_BE.png' },
        { id: 'CBC_BE', name: 'CBC Banque', logo: 'https://cdn.gocardless.com/icons/CBC_BE.png' },
        { id: 'CRELAN_BE', name: 'Crelan', logo: 'https://cdn.gocardless.com/icons/CRELAN_BE.png' },
        { id: 'DEUTSCHE_BANK_BE', name: 'Deutsche Bank Belgium', logo: 'https://cdn.gocardless.com/icons/DEUTSCHE_BANK_BE.png' },
        { id: 'EUROPABANK_BE', name: 'Europabank', logo: 'https://cdn.gocardless.com/icons/EUROPABANK_BE.png' },
        { id: 'KEYTRADE_BE', name: 'Keytrade Bank', logo: 'https://cdn.gocardless.com/icons/KEYTRADE_BE.png' },
        { id: 'NAGELMACKERS_BE', name: 'Bank Nagelmackers', logo: 'https://cdn.gocardless.com/icons/NAGELMACKERS_BE.png' },
        { id: 'RABOBANK_BE', name: 'Rabobank Belgium', logo: 'https://cdn.gocardless.com/icons/RABOBANK_BE.png' },
        { id: 'VDK_BANK_BE', name: 'VDK Bank', logo: 'https://cdn.gocardless.com/icons/VDK_BANK_BE.png' },
        { id: 'CPHI_BE', name: 'CPH Banque', logo: 'https://cdn.gocardless.com/icons/CPH_BE.png' },
        { id: 'BPOST_BE', name: 'bpost bank', logo: 'https://cdn.gocardless.com/icons/BPOST_BE.png' },
        { id: 'TRIODOS_BE', name: 'Triodos Bank', logo: 'https://cdn.gocardless.com/icons/TRIODOS_BE.png' },
        { id: 'REVOLUT_BE', name: 'Revolut Belgium', logo: 'https://cdn.gocardless.com/icons/REVOLUT_BE.png' },
        { id: 'N26_BE', name: 'N26 Belgium', logo: 'https://cdn.gocardless.com/icons/N26_BE.png' },
        { id: 'BUNQ_BE', name: 'bunq Belgium', logo: 'https://cdn.gocardless.com/icons/BUNQ_BE.png' },
        { id: 'AION_BE', name: 'Aion Bank', logo: 'https://cdn.gocardless.com/icons/AION_BE.png' },
        { id: 'HELLO_BANK_BE', name: 'Hello Bank!', logo: 'https://cdn.gocardless.com/icons/HELLO_BANK_BE.png' },
        { id: 'BEOBANK_BE', name: 'Beobank', logo: 'https://cdn.gocardless.com/icons/BEOBANK_BE.png' },
        { id: 'FINTRO_BE', name: 'Fintro', logo: 'https://cdn.gocardless.com/icons/FINTRO_BE.png' },
        { id: 'RECORD_BANK_BE', name: 'Record Bank', logo: 'https://cdn.gocardless.com/icons/RECORD_BANK_BE.png' },
        { id: 'DELEN_BE', name: 'Delen Private Bank', logo: 'https://cdn.gocardless.com/icons/DELEN_BE.png' },
        { id: 'MONEYOU_BE', name: 'MoneYou', logo: 'https://cdn.gocardless.com/icons/MONEYOU_BE.png' },
        { id: 'DEGROOF_PETERCAM_BE', name: 'Degroof Petercam', logo: 'https://cdn.gocardless.com/icons/DEGROOF_PETERCAM_BE.png' }
      ],
      'CZ': [
        { id: 'CSOB_CZ', name: 'ČSOB', logo: 'https://cdn.gocardless.com/icons/CSOB_CZ.png' },
        { id: 'CESKA_SPORITELNA_CZ', name: 'Česká spořitelna', logo: 'https://cdn.gocardless.com/icons/CESKA_SPORITELNA_CZ.png' },
        { id: 'KOMERCNI_BANKA_CZ', name: 'Komerční banka', logo: 'https://cdn.gocardless.com/icons/KOMERCNI_BANKA_CZ.png' },
        { id: 'MONETA_CZ', name: 'MONETA Money Bank', logo: 'https://cdn.gocardless.com/icons/MONETA_CZ.png' },
        { id: 'RAIFFEISEN_CZ', name: 'Raiffeisenbank', logo: 'https://cdn.gocardless.com/icons/RAIFFEISEN_CZ.png' }
      ],
      'DE': [
        { id: 'DEUTSCHE_BANK_DE', name: 'Deutsche Bank', logo: 'https://cdn.gocardless.com/icons/DEUTSCHE_DE.png' },
        { id: 'COMMERZBANK_DE', name: 'Commerzbank', logo: 'https://cdn.gocardless.com/icons/COMMERZBANK_DE.png' },
        { id: 'SPARKASSE_DE', name: 'Sparkasse', logo: 'https://cdn.gocardless.com/icons/SPARKASSE_DE.png' },
        { id: 'VOLKSBANK_DE', name: 'Volksbank Raiffeisenbank', logo: 'https://cdn.gocardless.com/icons/VOLKSBANK_DE.png' },
        { id: 'DKB_DE', name: 'Deutsche Kreditbank', logo: 'https://cdn.gocardless.com/icons/DKB_DE.png' },
        { id: 'COMDIRECT_DE', name: 'comdirect', logo: 'https://cdn.gocardless.com/icons/COMDIRECT_DE.png' },
        { id: 'HYPOVEREINSBANK_DE', name: 'HypoVereinsbank', logo: 'https://cdn.gocardless.com/icons/HYPOVEREINSBANK_DE.png' },
        { id: 'POSTBANK_DE', name: 'Postbank', logo: 'https://cdn.gocardless.com/icons/POSTBANK_DE.png' },
        { id: 'ING_DE', name: 'ING Germany', logo: 'https://cdn.gocardless.com/icons/ING_DE.png' },
        { id: 'N26_DE', name: 'N26', logo: 'https://cdn.gocardless.com/icons/N26_DE.png' }
      ],
      'DK': [
        { id: 'DANSKE_BANK_DK', name: 'Danske Bank', logo: 'https://cdn.gocardless.com/icons/DANSKE_BANK_DK.png' },
        { id: 'NORDEA_DK', name: 'Nordea', logo: 'https://cdn.gocardless.com/icons/NORDEA_DK.png' },
        { id: 'JYSKE_BANK_DK', name: 'Jyske Bank', logo: 'https://cdn.gocardless.com/icons/JYSKE_BANK_DK.png' },
        { id: 'NYKREDIT_DK', name: 'Nykredit', logo: 'https://cdn.gocardless.com/icons/NYKREDIT_DK.png' },
        { id: 'SYDBANK_DK', name: 'Sydbank', logo: 'https://cdn.gocardless.com/icons/SYDBANK_DK.png' }
      ],
      'EE': [
        { id: 'SWEDBANK_EE', name: 'Swedbank', logo: 'https://cdn.gocardless.com/icons/SWEDBANK_EE.png' },
        { id: 'SEB_EE', name: 'SEB', logo: 'https://cdn.gocardless.com/icons/SEB_EE.png' },
        { id: 'LHV_EE', name: 'LHV Pank', logo: 'https://cdn.gocardless.com/icons/LHV_EE.png' },
        { id: 'COOP_PANK_EE', name: 'Coop Pank', logo: 'https://cdn.gocardless.com/icons/COOP_PANK_EE.png' }
      ],
      'ES': [
        { id: 'SANTANDER_ES', name: 'Banco Santander', logo: 'https://cdn.gocardless.com/icons/SANTANDER_ES.png' },
        { id: 'BBVA_ES', name: 'BBVA', logo: 'https://cdn.gocardless.com/icons/BBVA_ES.png' },
        { id: 'CAIXABANK_ES', name: 'CaixaBank', logo: 'https://cdn.gocardless.com/icons/CAIXABANK_ES.png' },
        { id: 'SABADELL_ES', name: 'Banco Sabadell', logo: 'https://cdn.gocardless.com/icons/SABADELL_ES.png' },
        { id: 'BANKIA_ES', name: 'Bankia', logo: 'https://cdn.gocardless.com/icons/BANKIA_ES.png' },
        { id: 'UNICAJA_ES', name: 'Unicaja Banco', logo: 'https://cdn.gocardless.com/icons/UNICAJA_ES.png' },
        { id: 'IBERCAJA_ES', name: 'Ibercaja', logo: 'https://cdn.gocardless.com/icons/IBERCAJA_ES.png' },
        { id: 'KUTXABANK_ES', name: 'Kutxabank', logo: 'https://cdn.gocardless.com/icons/KUTXABANK_ES.png' },
        { id: 'BANKINTER_ES', name: 'Bankinter', logo: 'https://cdn.gocardless.com/icons/BANKINTER_ES.png' }
      ],
      'FI': [
        { id: 'NORDEA_FI', name: 'Nordea', logo: 'https://cdn.gocardless.com/icons/NORDEA_FI.png' },
        { id: 'OP_FI', name: 'OP Financial Group', logo: 'https://cdn.gocardless.com/icons/OP_FI.png' },
        { id: 'DANSKE_BANK_FI', name: 'Danske Bank', logo: 'https://cdn.gocardless.com/icons/DANSKE_BANK_FI.png' },
        { id: 'HANDELSBANKEN_FI', name: 'Handelsbanken', logo: 'https://cdn.gocardless.com/icons/HANDELSBANKEN_FI.png' },
        { id: 'AKTIA_FI', name: 'Aktia Bank', logo: 'https://cdn.gocardless.com/icons/AKTIA_FI.png' }
      ],
      'FR': [
        { id: 'CREDIT_AGRICOLE_FR', name: 'Crédit Agricole', logo: 'https://cdn.gocardless.com/icons/CREDIT_AGRICOLE_FR.png' },
        { id: 'BNP_PARIBAS_FR', name: 'BNP Paribas', logo: 'https://cdn.gocardless.com/icons/BNP_PARIBAS_FR.png' },
        { id: 'SOCIETE_GENERALE_FR', name: 'Société Générale', logo: 'https://cdn.gocardless.com/icons/SOCIETE_GENERALE_FR.png' },
        { id: 'CREDIT_MUTUEL_FR', name: 'Crédit Mutuel', logo: 'https://cdn.gocardless.com/icons/CREDIT_MUTUEL_FR.png' },
        { id: 'BANQUE_POPULAIRE_FR', name: 'Banque Populaire', logo: 'https://cdn.gocardless.com/icons/BANQUE_POPULAIRE_FR.png' },
        { id: 'CAISSE_EPARGNE_FR', name: 'Caisse d\'Épargne', logo: 'https://cdn.gocardless.com/icons/CAISSE_EPARGNE_FR.png' },
        { id: 'LCL_FR', name: 'LCL', logo: 'https://cdn.gocardless.com/icons/LCL_FR.png' },
        { id: 'BOURSORAMA_FR', name: 'Boursorama', logo: 'https://cdn.gocardless.com/icons/BOURSORAMA_FR.png' },
        { id: 'HSBC_FR', name: 'HSBC France', logo: 'https://cdn.gocardless.com/icons/HSBC_FR.png' },
        { id: 'LA_BANQUE_POSTALE_FR', name: 'La Banque Postale', logo: 'https://cdn.gocardless.com/icons/LA_BANQUE_POSTALE_FR.png' }
      ],
      'GB': [
        { id: 'HSBC_GB', name: 'HSBC UK', logo: 'https://cdn.gocardless.com/icons/HSBC_GB.png' },
        { id: 'BARCLAYS_GB', name: 'Barclays', logo: 'https://cdn.gocardless.com/icons/BARCLAYS_GB.png' },
        { id: 'LLOYDS_GB', name: 'Lloyds Bank', logo: 'https://cdn.gocardless.com/icons/LLOYDS_GB.png' },
        { id: 'NATWEST_GB', name: 'NatWest', logo: 'https://cdn.gocardless.com/icons/NATWEST_GB.png' },
        { id: 'SANTANDER_GB', name: 'Santander UK', logo: 'https://cdn.gocardless.com/icons/SANTANDER_GB.png' },
        { id: 'RBS_GB', name: 'Royal Bank of Scotland', logo: 'https://cdn.gocardless.com/icons/RBS_GB.png' },
        { id: 'HALIFAX_GB', name: 'Halifax', logo: 'https://cdn.gocardless.com/icons/HALIFAX_GB.png' },
        { id: 'MONZO_GB', name: 'Monzo', logo: 'https://cdn.gocardless.com/icons/MONZO_GB.png' },
        { id: 'STARLING_GB', name: 'Starling Bank', logo: 'https://cdn.gocardless.com/icons/STARLING_GB.png' },
        { id: 'TSB_GB', name: 'TSB', logo: 'https://cdn.gocardless.com/icons/TSB_GB.png' },
        { id: 'REVOLUT_GB', name: 'Revolut', logo: 'https://cdn.gocardless.com/icons/REVOLUT_GB.png' },
        { id: 'FIRST_DIRECT_GB', name: 'First Direct', logo: 'https://cdn.gocardless.com/icons/FIRST_DIRECT_GB.png' }
      ],
      'IE': [
        { id: 'AIB_IE', name: 'AIB', logo: 'https://cdn.gocardless.com/icons/AIB_IE.png' },
        { id: 'BOI_IE', name: 'Bank of Ireland', logo: 'https://cdn.gocardless.com/icons/BOI_IE.png' },
        { id: 'ULSTER_BANK_IE', name: 'Ulster Bank', logo: 'https://cdn.gocardless.com/icons/ULSTER_BANK_IE.png' },
        { id: 'PTSB_IE', name: 'Permanent TSB', logo: 'https://cdn.gocardless.com/icons/PTSB_IE.png' },
        { id: 'KBC_IE', name: 'KBC Bank Ireland', logo: 'https://cdn.gocardless.com/icons/KBC_IE.png' }
      ],
      'IT': [
        { id: 'UNICREDIT_IT', name: 'UniCredit', logo: 'https://cdn.gocardless.com/icons/UNICREDIT_IT.png' },
        { id: 'INTESA_SANPAOLO_IT', name: 'Intesa Sanpaolo', logo: 'https://cdn.gocardless.com/icons/INTESA_SANPAOLO_IT.png' },
        { id: 'MONTE_PASCHI_IT', name: 'Monte dei Paschi di Siena', logo: 'https://cdn.gocardless.com/icons/MONTE_PASCHI_IT.png' },
        { id: 'UBI_BANCA_IT', name: 'UBI Banca', logo: 'https://cdn.gocardless.com/icons/UBI_BANCA_IT.png' },
        { id: 'BPM_IT', name: 'Banco BPM', logo: 'https://cdn.gocardless.com/icons/BPM_IT.png' },
        { id: 'BPER_IT', name: 'BPER Banca', logo: 'https://cdn.gocardless.com/icons/BPER_IT.png' },
        { id: 'CREDEM_IT', name: 'Credem', logo: 'https://cdn.gocardless.com/icons/CREDEM_IT.png' },
        { id: 'FINECO_IT', name: 'FinecoBank', logo: 'https://cdn.gocardless.com/icons/FINECO_IT.png' }
      ],
      'LT': [
        { id: 'SWEDBANK_LT', name: 'Swedbank', logo: 'https://cdn.gocardless.com/icons/SWEDBANK_LT.png' },
        { id: 'SEB_LT', name: 'SEB', logo: 'https://cdn.gocardless.com/icons/SEB_LT.png' },
        { id: 'LUMINOR_LT', name: 'Luminor Bank', logo: 'https://cdn.gocardless.com/icons/LUMINOR_LT.png' },
        { id: 'CITADELE_LT', name: 'Citadele', logo: 'https://cdn.gocardless.com/icons/CITADELE_LT.png' }
      ],
      'LV': [
        { id: 'SWEDBANK_LV', name: 'Swedbank', logo: 'https://cdn.gocardless.com/icons/SWEDBANK_LV.png' },
        { id: 'SEB_LV', name: 'SEB', logo: 'https://cdn.gocardless.com/icons/SEB_LV.png' },
        { id: 'CITADELE_LV', name: 'Citadele', logo: 'https://cdn.gocardless.com/icons/CITADELE_LV.png' },
        { id: 'LUMINOR_LV', name: 'Luminor Bank', logo: 'https://cdn.gocardless.com/icons/LUMINOR_LV.png' }
      ],
      'NL': [
        { id: 'ING_NL', name: 'ING', logo: 'https://cdn.gocardless.com/icons/ING_NL.png' },
        { id: 'RABOBANK_NL', name: 'Rabobank', logo: 'https://cdn.gocardless.com/icons/RABOBANK_NL.png' },
        { id: 'ABN_AMRO_NL', name: 'ABN AMRO', logo: 'https://cdn.gocardless.com/icons/ABN_AMRO_NL.png' },
        { id: 'SNS_NL', name: 'SNS Bank', logo: 'https://cdn.gocardless.com/icons/SNS_NL.png' },
        { id: 'ASN_BANK_NL', name: 'ASN Bank', logo: 'https://cdn.gocardless.com/icons/ASN_BANK_NL.png' },
        { id: 'BUNQ_NL', name: 'bunq', logo: 'https://cdn.gocardless.com/icons/BUNQ_NL.png' }
      ],
      'NO': [
        { id: 'DNB_NO', name: 'DNB', logo: 'https://cdn.gocardless.com/icons/DNB_NO.png' },
        { id: 'NORDEA_NO', name: 'Nordea', logo: 'https://cdn.gocardless.com/icons/NORDEA_NO.png' },
        { id: 'SPAREBANK1_NO', name: 'SpareBank 1', logo: 'https://cdn.gocardless.com/icons/SPAREBANK1_NO.png' },
        { id: 'HANDELSBANKEN_NO', name: 'Handelsbanken', logo: 'https://cdn.gocardless.com/icons/HANDELSBANKEN_NO.png' },
        { id: 'DANSKE_BANK_NO', name: 'Danske Bank', logo: 'https://cdn.gocardless.com/icons/DANSKE_BANK_NO.png' }
      ],
      'PL': [
        { id: 'PKO_BP_PL', name: 'PKO Bank Polski', logo: 'https://cdn.gocardless.com/icons/PKO_BP_PL.png' },
        { id: 'PEKAO_PL', name: 'Bank Pekao', logo: 'https://cdn.gocardless.com/icons/PEKAO_PL.png' },
        { id: 'SANTANDER_PL', name: 'Santander Bank Polska', logo: 'https://cdn.gocardless.com/icons/SANTANDER_PL.png' },
        { id: 'MBANK_PL', name: 'mBank', logo: 'https://cdn.gocardless.com/icons/MBANK_PL.png' },
        { id: 'ING_PL', name: 'ING Bank Śląski', logo: 'https://cdn.gocardless.com/icons/ING_PL.png' },
        { id: 'BNP_PARIBAS_PL', name: 'BNP Paribas Bank Polska', logo: 'https://cdn.gocardless.com/icons/BNP_PARIBAS_PL.png' },
        { id: 'MILLENNIUM_PL', name: 'Bank Millennium', logo: 'https://cdn.gocardless.com/icons/MILLENNIUM_PL.png' }
      ],
      'PT': [
        { id: 'CGD_PT', name: 'Caixa Geral de Depósitos', logo: 'https://cdn.gocardless.com/icons/CGD_PT.png' },
        { id: 'MILLENNIUM_BCP_PT', name: 'Millennium BCP', logo: 'https://cdn.gocardless.com/icons/MILLENNIUM_BCP_PT.png' },
        { id: 'SANTANDER_PT', name: 'Santander Totta', logo: 'https://cdn.gocardless.com/icons/SANTANDER_PT.png' },
        { id: 'NOVO_BANCO_PT', name: 'Novo Banco', logo: 'https://cdn.gocardless.com/icons/NOVO_BANCO_PT.png' },
        { id: 'BPI_PT', name: 'Banco BPI', logo: 'https://cdn.gocardless.com/icons/BPI_PT.png' }
      ],
      'RO': [
        { id: 'BCR_RO', name: 'Banca Comercială Română', logo: 'https://cdn.gocardless.com/icons/BCR_RO.png' },
        { id: 'BRD_RO', name: 'BRD - Groupe Société Générale', logo: 'https://cdn.gocardless.com/icons/BRD_RO.png' },
        { id: 'BANCA_TRANSILVANIA_RO', name: 'Banca Transilvania', logo: 'https://cdn.gocardless.com/icons/BANCA_TRANSILVANIA_RO.png' },
        { id: 'RAIFFEISEN_RO', name: 'Raiffeisen Bank', logo: 'https://cdn.gocardless.com/icons/RAIFFEISEN_RO.png' },
        { id: 'ING_RO', name: 'ING Bank', logo: 'https://cdn.gocardless.com/icons/ING_RO.png' }
      ],
      'SE': [
        { id: 'NORDEA_SE', name: 'Nordea', logo: 'https://cdn.gocardless.com/icons/NORDEA_SE.png' },
        { id: 'SEB_SE', name: 'SEB', logo: 'https://cdn.gocardless.com/icons/SEB_SE.png' },
        { id: 'HANDELSBANKEN_SE', name: 'Handelsbanken', logo: 'https://cdn.gocardless.com/icons/HANDELSBANKEN_SE.png' },
        { id: 'SWEDBANK_SE', name: 'Swedbank', logo: 'https://cdn.gocardless.com/icons/SWEDBANK_SE.png' },
        { id: 'LANSFORSAKRINGAR_SE', name: 'Länsförsäkringar Bank', logo: 'https://cdn.gocardless.com/icons/LANSFORSAKRINGAR_SE.png' },
        { id: 'SKANDIABANKEN_SE', name: 'Skandiabanken', logo: 'https://cdn.gocardless.com/icons/SKANDIABANKEN_SE.png' }
      ],
      'SK': [
        { id: 'SLOVENSKA_SPORITELNA_SK', name: 'Slovenská sporiteľňa', logo: 'https://cdn.gocardless.com/icons/SLOVENSKA_SPORITELNA_SK.png' },
        { id: 'VUB_BANKA_SK', name: 'VÚB Banka', logo: 'https://cdn.gocardless.com/icons/VUB_BANKA_SK.png' },
        { id: 'TATRA_BANKA_SK', name: 'Tatra banka', logo: 'https://cdn.gocardless.com/icons/TATRA_BANKA_SK.png' },
        { id: 'CSOB_SK', name: 'ČSOB', logo: 'https://cdn.gocardless.com/icons/CSOB_SK.png' },
        { id: 'POSTOVA_BANKA_SK', name: 'Poštová banka', logo: 'https://cdn.gocardless.com/icons/POSTOVA_BANKA_SK.png' }
      ]
    };
    
    // Default to empty array if country not found
    const banks = banksByCountry[country] || [];
    
    return NextResponse.json({ banks });
    
    /* Comment out the backend API call until your backend is ready
    // Make request to the backend to get banks for the country
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendPath = `/backend/gocardless/banks?country=${country}`; // Change to your actual backend path
    
    console.log(`Fetching banks from: ${apiUrl}${backendPath}`);
    
    const response = await fetch(`${apiUrl}${backendPath}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);
      
      let errorMessage = 'Failed to fetch banks';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If the response is not JSON, use the error text
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    */
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 });
  }
} 
const { MessageMedia } = require('whatsapp-web.js');
const sendResponse = require('../../utils/response');
const whatsappService = require('./service');

exports.sendPDF = async (req, res) => {
  try {
    const { phone, pdfBase64, filename } = req.body;

    if (!phone || !pdfBase64) {
      return sendResponse(res, 400, false, 'Phone and pdfBase64 are required');
    }

    // Clean phone: remove non-digits, ensure country code prefix
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = (process.env.WHATSAPP_COUNTRY_CODE || '91') + cleanPhone;
    }

    // Strip data URL prefix (e.g., "data:application/pdf;base64,") if present
    const base64Data = pdfBase64.includes('base64,')
      ? pdfBase64.split('base64,')[1]
      : pdfBase64;

    const media = new MessageMedia('application/pdf', base64Data, filename);

    await whatsappService.sendMedia(cleanPhone, media, filename);

    return sendResponse(res, 200, true, `PDF sent to ${cleanPhone}`, { phone: cleanPhone, filename });
  } catch (error) {
    return sendResponse(res, 500, false, `WhatsApp send failed: ${error.message}`);
  }
};

exports.getStatus = async (req, res) => {
  const status = whatsappService.getStatus();
  return sendResponse(res, 200, true, 'WhatsApp status', status);
};

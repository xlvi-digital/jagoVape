/**
 * Google Apps Script - FULL SECURITY & CRUD
 * Link Spreadsheet: Tab 'Admin_Users' dan 'Products'
 * Struktur Admin_Users: [Username, Hashed_Password, Token, Token_Expiry, Login_Attempts, Lock_Until]
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date().getTime();
    
    // --- 1. LOGIKA LOGIN ---
    if (data.action === "login") {
      const sheet = ss.getSheetByName('Admin_Users');
      if (!sheet) return sendResponse({ success: false, message: "Sheet 'Admin_Users' tidak ditemukan." });
      
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.username) {
          const attempts = values[i][4] || 0;
          const lockUntil = values[i][5] ? new Date(values[i][5]).getTime() : 0;
          
          if (lockUntil > now) {
            const waitTime = Math.ceil((lockUntil - now) / 60000);
            return sendResponse({ success: false, message: `Akun terkunci. Tunggu ${waitTime} menit.` });
          }

          if (values[i][1] === data.hashedPassword) {
            const token = Utilities.getUuid();
            const expiry = now + (2 * 60 * 60 * 1000); // 2 Jam
            sheet.getRange(i + 1, 3, 1, 4).setValues([[token, new Date(expiry), 0, ""]]);
            return sendResponse({ success: true, token: token });
          } else {
            const newAttempts = attempts + 1;
            let newLock = "";
            if (newAttempts >= 5) newLock = new Date(now + (15 * 60 * 1000));
            sheet.getRange(i + 1, 5, 1, 2).setValues([[newAttempts, newLock]]);
            return sendResponse({ success: false, message: `Password salah (${newAttempts}/5)` });
          }
        }
      }
      return sendResponse({ success: false, message: "User tidak ditemukan." });
    }

    // --- 2. LOGIKA AMBIL DATA (Publik) ---
    if (data.action === "get_products") {
      const sheet = ss.getSheetByName("Products");
      const values = sheet.getDataRange().getValues();
      const products = [];
      for (let i = 1; i < values.length; i++) {
        products.push({ id: values[i][0], timestamp: values[i][1], nama: values[i][2], harga: values[i][3], kategori: values[i][4], deskripsi: values[i][5], gambar: values[i][6] });
      }
      return sendResponse({ success: true, data: products });
    }

    // --- 3. VALIDASI TOKEN (Aksi Sensitif) ---
    const auth = validateToken(data.token, ss);
    if (!auth.success) return sendResponse(auth);

    const sheet = ss.getSheetByName("Products");

    // --- 4. CRUD OPERATIONS ---
    if (data.action === "add_product") {
      const folderId = "1s4OxBTED5MLCayyU2kJgZD8z8v86sdOC"; 
      let imageUrl = data.gambar || "";
      if (data.gambar && data.gambar.startsWith("data:image")) {
        const parts = data.gambar.split(",");
        const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), parts[0].split(":")[1].split(";")[0], "IMG_" + Date.now());
        const file = DriveApp.getFolderById(folderId).createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        imageUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      }
      sheet.appendRow(["PROD-" + Date.now(), new Date(), data.nama, data.harga, data.kategori, data.deskripsi, imageUrl]);
      return sendResponse({ success: true });
    }

    if (data.action === "update_product") {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          let imageUrl = data.gambar;
          if (data.gambar && data.gambar.startsWith("data:image")) {
            const parts = data.gambar.split(",");
            const blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), parts[0].split(":")[1].split(";")[0], "IMG_U_" + Date.now());
            const file = DriveApp.getFolderById("1s4OxBTED5MLCayyU2kJgZD8z8v86sdOC").createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            imageUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
          }
          sheet.getRange(i + 1, 3, 1, 5).setValues([[data.nama, data.harga, data.kategori, data.deskripsi, imageUrl]]);
          return sendResponse({ success: true });
        }
      }
    }

    if (data.action === "delete_product") {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.id) {
          sheet.deleteRow(i + 1);
          return sendResponse({ success: true });
        }
      }
    }

    if (data.action === "bulk_upload") {
      data.data.forEach((item, index) => {
        sheet.appendRow(["PROD-" + (Date.now() + index), new Date(), item.Nama || item.nama, item.Harga || item.harga, item.Kategori || item.kategori, item.Deskripsi || item.deskripsi, item.Gambar || item.gambar || ""]);
      });
      return sendResponse({ success: true });
    }

  } catch (error) {
    return sendResponse({ success: false, message: error.toString() });
  }
}

function validateToken(token, ss) {
  if (!token) return { success: false, message: "Token Kosong", code: 403 };
  const sheet = ss.getSheetByName('Admin_Users');
  const values = sheet.getDataRange().getValues();
  const now = new Date().getTime();
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] === token) {
      const expiry = new Date(values[i][3]).getTime();
      if (now > expiry) return { success: false, message: "Token Expired", code: 403, expired: true };
      return { success: true };
    }
  }
  return { success: false, message: "Token Invalid", code: 403 };
}

function sendResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function setupBackend() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName("Admin_Users") || ss.insertSheet("Admin_Users");
  userSheet.clear();
  userSheet.appendRow(["Username", "Hashed_Password", "Token", "Token_Expiry", "Login_Attempts", "Lock_Until"]);
  userSheet.appendRow(["admin", "ef92b778bafe771e89245b89ec8c9914c0353c7a050f69d30009c95d9e50f38c", "", "", 0, ""]);
  
  if (!ss.getSheetByName("Products")) {
    const prodSheet = ss.insertSheet("Products");
    prodSheet.appendRow(["ID", "Timestamp", "Nama Produk", "Harga", "Kategori", "Deskripsi", "URL Gambar"]);
  }
}

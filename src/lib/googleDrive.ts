
const API_URL = 'https://www.googleapis.com/drive/v3/files';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

async function fetchDrive(url: string, token: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Credentials');
    }
    throw new Error(`Failed to fetch from Google Drive: ${response.statusText}`);
  }

  return response.json();
}

export async function listFolders(token: string, folderId?: string): Promise<DriveFile[]> {
  let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  } else {
    query += " and 'root' in parents";
  }

  const url = `${API_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,modifiedTime,iconLink,thumbnailLink)&orderBy=folder,name`;
  const data = await fetchDrive(url, token);
  return data.files || [];
}

export async function listFilesInFolder(token: string, folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
  const url = `${API_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,modifiedTime,size,iconLink,thumbnailLink)&orderBy=name`;
  const data = await fetchDrive(url, token);
  return data.files || [];
}

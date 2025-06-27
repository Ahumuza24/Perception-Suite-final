Leveraging Google Drive API to Display Folders in Your App
🔧 API Setup & Authentication

1. Google Cloud Console Setup
javascript// Required scopes for Drive API access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly', // Read-only access
  'https://www.googleapis.com/auth/drive.metadata.readonly', // Metadata only
  // OR for full access:
  'https://www.googleapis.com/auth/drive'
];


2. Supabase + Google Drive Integration
Since you're using Supabase, you'll need to store the Google access tokens securely:
sql-- Add to your Supabase schema
CREATE TABLE user_drive_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

📡 API Integration Methods
Method 1: Client-Side Integration (Recommended for your use case)
javascript// Install Google APIs client
npm install googleapis google-auth-library

// React component for Drive integration
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const DriveIntegration = ({ userEmail }) => {
  const [driveData, setDriveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDriveAPI();
  }, []);

  const initializeDriveAPI = async () => {
    try {
      // Get user's stored tokens from Supabase
      const { data: tokens } = await supabase
        .from('user_drive_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tokens) {
        await loadDriveData(tokens.access_token);
      } else {
        // Need to authenticate with Google Drive
        await authenticateWithDrive();
      }
    } catch (error) {
      console.error('Drive API initialization failed:', error);
    }
  };

  const loadDriveData = async (accessToken) => {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'&pageSize=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    setDriveData(data);
    setLoading(false);
  };
};


🎨 Enhanced Dashboard with Drive Integration
Updated Dashboard ComponentEnhanced Dashboard with Google Drive IntegrationInteractive artifact 📁 Drive API Implementation Details
Key API Endpoints You'll Use

List Folders

javascriptGET https://www.googleapis.com/drive/v3/files
?q=mimeType='application/vnd.google-apps.folder'
&fields=files(id,name,modifiedTime,size,parents,webViewLink)
&pageSize=50

Get Folder Contents

javascriptGET https://www.googleapis.com/drive/v3/files
?q='FOLDER_ID'+in+parents
&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)

Get File Metadata

javascriptGET https://www.googleapis.com/drive/v3/files/{fileId}
?fields=id,name,mimeType,size,modifiedTime,owners,permissions


Sample Dasboard Implementation
import React, { useState, useEffect } from 'react';
import { Folder, File, Users, Clock, Shield, ExternalLink, Search, Grid, List, ChevronRight } from 'lucide-react';

const DriveDashboard = () => {
  const [driveData, setDriveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  // Mock user data - replace with actual Supabase auth
  const user = {
    name: 'John Smith',
    email: 'john@lawfirm1.com',
    domain: 'lawfirm1.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  };

  // Mock Drive data - replace with actual API calls
  const mockDriveData = {
    folders: [
      {
        id: '1',
        name: 'Client Documents',
        modifiedTime: '2024-01-15T10:30:00Z',
        size: '2.4 GB',
        fileCount: 156,
        iconColorHue: 220
      },
      {
        id: '2',
        name: 'Legal Templates',
        modifiedTime: '2024-01-14T15:45:00Z',
        size: '894 MB',
        fileCount: 43,
        iconColorHue: 160
      },
      {
        id: '3',
        name: 'Team Resources',
        modifiedTime: '2024-01-13T09:20:00Z',
        size: '1.1 GB',
        fileCount: 89,
        iconColorHue: 280
      },
      {
        id: '4',
        name: 'Project Alpha',
        modifiedTime: '2024-01-12T14:15:00Z',
        size: '567 MB',
        fileCount: 32,
        iconColorHue: 40
      }
    ],
    recentFiles: [
      { name: 'Contract_Review_Q1.pdf', modifiedTime: '2 hours ago', size: '2.1 MB' },
      { name: 'Meeting_Notes_Jan15.docx', modifiedTime: '4 hours ago', size: '156 KB' },
      { name: 'Budget_2024_Draft.xlsx', modifiedTime: 'Yesterday', size: '890 KB' }
    ]
  };

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setDriveData(mockDriveData);
      setLoading(false);
    }, 1500);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFolders = driveData?.folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting up your workspace...</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Verified your identity</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Located your organization ({user.domain})</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Loading your Drive folders...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">LawFirm1 Drive Portal</h1>
                  <p className="text-xs text-gray-500">Secure Document Access</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure Connection</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                👋 Welcome back, {user.name.split(' ')[0]}!
              </h2>
              <p className="text-gray-600">
                Accessing resources for <span className="font-semibold text-blue-600">{user.domain}</span>
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{user.domain}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last login</div>
              <div className="font-semibold text-gray-900">Today 9:30 AM</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Drive Folders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" />
                  Your Drive Folders
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredFolders.length} folders available
                </p>
              </div>
              
              <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}`}>
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `hsl(${folder.iconColorHue}, 70%, 90%)` }}
                        >
                          <Folder 
                            className="w-5 h-5"
                            style={{ color: `hsl(${folder.iconColorHue}, 70%, 50%)` }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {folder.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{folder.fileCount} files</span>
                            <span>{folder.size}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>Modified {formatDate(folder.modifiedTime)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open Full Google Drive
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Folders</span>
                  <span className="font-semibold">{driveData.folders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Used</span>
                  <span className="font-semibold">5.1 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Level</span>
                  <span className="font-semibold text-green-600">Full Access</span>
                </div>
              </div>
            </div>

            {/* Recent Files */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {driveData.recentFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <File className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {file.modifiedTime} • {file.size}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">
                Contact IT support for assistance with Drive access or file permissions.
              </p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriveDashboard;
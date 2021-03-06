/*
  Enter a custom C# script here. C# is case sensitive.
  "app" references the current application.
  Example:
  MessageBox.Show(app.Name);
  
  = Notable methods =
  app.PreviousLocation
    Corresponds to the variable {file}

  app.Variables.ReplaceAllInString("Any {text} with variables.")
    Replaces all known variables in a given string.
    Example: string new = app.Variables.ReplaceAllInString("{file}")

  return;
    Exits the script.

  Abort("Error text");
    Exits the script with a given error.
*/

/// <summary>
/// Opens a new RegistryKey that represents the requested key on the local machine with the specified view.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <returns>The requested registry key.</returns>
Func<string, Microsoft.Win32.RegistryKey> RegOpenSubKey = new Func<string, Microsoft.Win32.RegistryKey>( (rootName) =>
	{
		Microsoft.Win32.RegistryKey localKey = null;
		Microsoft.Win32.RegistryHive hKey = Microsoft.Win32.RegistryHive.CurrentUser;
		Microsoft.Win32.RegistryView view = Microsoft.Win32.RegistryView.Default;
		
		if (rootName.Substring(Math.Max(0, rootName.Length - 2)) == "64")
		{
			if (Environment.Is64BitOperatingSystem)
			{
				view = Microsoft.Win32.RegistryView.Registry64;
			}
			else
			{
				Abort("RegOpenSubKey: OS Arch mismatch.");
			}
		}
		
		switch(rootName.Replace("64", ""))
		{
			case "HKEY_CLASSES_ROOT":
			case "HKCR":
				hKey = Microsoft.Win32.RegistryHive.ClassesRoot;
				break;
				
			case "HKEY_CURRENT_CONFIG":
			case "HKCC":
				hKey = Microsoft.Win32.RegistryHive.CurrentConfig;
				break;
			
			case "HKEY_CURRENT_USER":
			case "HKCU":
				hKey = Microsoft.Win32.RegistryHive.CurrentUser;
				break;
				
			case "HKEY_LOCAL_MACHINE":
			case "HKLM":
				hKey = Microsoft.Win32.RegistryHive.LocalMachine;
				break;
				
			case "HKEY_USERS":
			case "HKU":
				hKey = Microsoft.Win32.RegistryHive.Users;
				break;
				
			default:
				Abort("Root = (Unknown)");
				break;
		}
		
		localKey = Microsoft.Win32.RegistryKey.OpenBaseKey(hKey, view);
		return localKey;
	});

/// <summary>
/// Creates a new subkey or opens an existing subkey for write access.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="keyName">The name or path of the subkey to create or open. This string is not case-sensitive.</param>
/// <returns>Returns false if the operation failed.</returns>
Func<string, string, bool> RegCreateKey = new Func<string, string, bool>( (rootName, keyName) =>
    {
		try
		{
			Ketarin.Forms.LogDialog.Log("RegCreateKey(" + rootName + ", " + keyName + ")");
			
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			// localKey = localKey.OpenSubKey(keyName, writable: true);
			
			using (localKey)
			{
				if (localKey != null)
				{
					localKey.CreateSubKey( keyName );
				}
				else
				{
					// Abort("Key " + rootName + @"\" + keyName + " not found.");
				}
			}
		}
		catch (Exception ex)
		{
			// Abort(ex.ToString());
			return false;
		}
		
		return true;
	});

/// <summary>
/// Deletes a subkey and any child subkeys recursively. No warning will be provided.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The subkey to delete. This string is not case-sensitive.</param>
/// <returns>Returns false if the operation failed.</returns>
Func<string, string, bool> RegDeleteKey = new Func<string, string, bool>( (rootName, subKeyName) =>
    {
		try
		{
			Ketarin.Forms.LogDialog.Log("RegDeleteKey(" + rootName + ", " + subKeyName + ")");
			
			string keyName = subKeyName.Substring(0, subKeyName.LastIndexOf(@"\"));
			string subTreeName = subKeyName.Substring(subKeyName.LastIndexOf(@"\")+1);
			
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName, writable: true);
		
			using (localKey)
			{
				if (localKey != null)
				{
					localKey.DeleteSubKeyTree(subTreeName);
				}
			}
		}
		catch (Exception ex)
		{
			return false;
			// Abort(ex.ToString());
		}
		
		return true;
	});

/// <summary>
/// Retrieves the value associated with the specified name.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <param name="valueName">The name of the value to retrieve. This string is not case-sensitive. When the GetValue method retrieves expandable string values (RegistryValueKind.ExpandString), it expands environment strings using data from the local environment.</param>
/// <returns>Returns null if the name/value pair does not exist in the registry.</returns>
Func<string, string, string, object> RegGetValue = new Func<string, string, string, object>( (rootName, keyName, valueName) =>
    {
		try
		{
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			Ketarin.Forms.LogDialog.Log("RegGetValue(" + rootName + ", " + keyName + ", " + valueName + ")");
		
			using (localKey)
			{
				if (localKey != null)
				{
					if (localKey.GetValue(valueName) != null) // Value exists
					{
						switch(localKey.GetValueKind(valueName))
						{
							case Microsoft.Win32.RegistryValueKind.String:
							case Microsoft.Win32.RegistryValueKind.ExpandString:
								Object o = localKey.GetValue(valueName);
								Ketarin.Forms.LogDialog.Log(valueName + " = " + (o as String));
								return (o as String);
									
							case Microsoft.Win32.RegistryValueKind.Binary:
								byte [] bytes = (byte[])localKey.GetValue(valueName);
								// result == "\x74\x00\x65\x00\x73\x00\x74\x00" == "t\0e\0s\0t\0"
								// Notice the Null \0 characters? When you display such a string in a textbox, only the part of the string until the first Null character is displayed.
								//                                  								Unicode
								Ketarin.Forms.LogDialog.Log(valueName + " = " + System.Text.Encoding.ASCII.GetString(bytes).Replace("\0", " "));
								return System.Text.Encoding.ASCII.GetString(bytes);
							case Microsoft.Win32.RegistryValueKind.DWord:
								Ketarin.Forms.LogDialog.Log(valueName + " = " + Convert.ToString((Int32)localKey.GetValue(valueName)));
								return Convert.ToString((Int32)localKey.GetValue(valueName));
							
							case Microsoft.Win32.RegistryValueKind.QWord:
								Ketarin.Forms.LogDialog.Log(valueName + " = " + Convert.ToString((Int64)localKey.GetValue(valueName)));
								return Convert.ToString((Int64)localKey.GetValue(valueName));
							
							case Microsoft.Win32.RegistryValueKind.MultiString:
								Ketarin.Forms.LogDialog.Log(valueName + " = " + (string[])localKey.GetValue(valueName));
								return (string[])localKey.GetValue(valueName);
								/*
								foreach (string s in (string[])valueName)
								{
									valueMultiString += ("[{s:s}], ");
								}
								*/
							default:
								Ketarin.Forms.LogDialog.Log("Value = (Unknown)");
								break;
						}
					}
				}
				else
				{
					Ketarin.Forms.LogDialog.Log("Value " + rootName + @"\" + keyName + @"\" + valueName + " not found.");
				}
			}
		}
		catch (Exception ex)  //just for demonstration...it's always best to handle specific exceptions
		{
			Ketarin.Forms.LogDialog.Log(ex.ToString());
		}

        return null;
	});

/// <summary>
/// Retrieves the registry data type of the value associated with the specified name.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <param name="valueName">The registry data type of the value associated with name. A registry key can have one value that is not associated with any name. When this unnamed value is displayed in the registry editor, the string "(Default)" appears instead of a name. To retrieve the registry data type of this unnamed value, specify either null or the empty string ("") for name.</param>
/// <returns>Returns a string value with the data type of the value associated with name. Returns null if the name/value pair does not exist in the registry.</returns>
Func<string, string, string, string> RegGetValueKind = new Func<string, string, string, string>( (rootName, keyName, valueName) =>
    {
		try
		{
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			Ketarin.Forms.LogDialog.Log("RegGetValueKind(" + rootName + ", " + keyName + ", " + valueName + ")");
		
			using (localKey)
			{
				if (localKey != null)
				{
					if (localKey.GetValue(valueName) != null) // Value exists
					{
						switch(localKey.GetValueKind(valueName))
						{
							case Microsoft.Win32.RegistryValueKind.String:
								return "REG_SZ";
							case Microsoft.Win32.RegistryValueKind.ExpandString:
								return "REG_EXPAND_SZ";
							case Microsoft.Win32.RegistryValueKind.Binary:
								return "REG_BINARY";
							case Microsoft.Win32.RegistryValueKind.DWord:
								return "REG_DWORD";
							case Microsoft.Win32.RegistryValueKind.QWord:
								return "REG_QWORD";
							case Microsoft.Win32.RegistryValueKind.MultiString:
								return "REG_MULTI_SZ";
							default:
								Ketarin.Forms.LogDialog.Log("ValueKind = (Unknown)");
								break;
						}
					}
					else
					{
						return null;
					}
				}
			}
		}
		catch (Exception ex)
		{
			// Ketarin.Forms.LogDialog.Log(ex.ToString());
		}
		
		return null;
	});

/// <summary>
/// Sets the value of a name/value pair in the registry key, using the specified registry data type.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <param name="valueName">The name of the value to be stored. If the specified name does not exist in the key, it is created, and the associated value is set to value. A registry key can have one value that is not associated with any name. When this unnamed value is displayed in the registry editor, the string "(Default)" appears instead of a name. To set this unnamed value, specify either null or the empty string ("") for name.</param>
/// <param name="o">The data to be stored.</param>
/// <param name="valueKind">The registry data type to use when storing the data.</param>
/// <returns>Returns true if the name/value pair can be written to; or false if the operation failed.</returns>
Func<string, string, string, object, string, bool> RegSetValue = new Func<string, string, string, object, string, bool>( (rootName, keyName, valueName, o, valueKind) =>
	{
		try
		{
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			Ketarin.Forms.LogDialog.Log("RegSetValue(" + rootName + ", " + keyName + ", " + valueName + ", " + valueKind + ")");
			
			Microsoft.Win32.RegistryValueKind typeIn = Microsoft.Win32.RegistryValueKind.None;		
			switch(valueKind)
			{
				case "REG_SZ":
					typeIn = Microsoft.Win32.RegistryValueKind.String;
					break;
				case "REG_EXPAND_SZ":
					typeIn = Microsoft.Win32.RegistryValueKind.ExpandString;
					break;		
				case "REG_BINARY":
					typeIn = Microsoft.Win32.RegistryValueKind.Binary;
					break;
				case "REG_DWORD":
					typeIn = Microsoft.Win32.RegistryValueKind.DWord;
					break;
				case "REG_QWORD":
					typeIn = Microsoft.Win32.RegistryValueKind.QWord;
					break;
				case "REG_MULTI_SZ":
					typeIn = Microsoft.Win32.RegistryValueKind.MultiString;
					break;
				default:
					Ketarin.Forms.LogDialog.Log("ValueKind = (Unknown)");
					break;
			}
			
			using (localKey)
			{
				if (localKey == null)
				{
					if (!(RegCreateKey(rootName, keyName)))
					{
						Ketarin.Forms.LogDialog.Log("RegSetValue: Key " + rootName + @"\" + keyName + " not found and could not be created.");
						return false;
					}
				}
				else
				{
					if((RegGetValue(rootName, keyName, valueName) as String) != null) // Value exists
					{
						if (localKey.GetValueKind(valueName) != typeIn)
						{
							Ketarin.Forms.LogDialog.Log("RegSetValue: The specified value name already exists.");
							return false;
						}
					}
				}
				
				switch(typeIn)
				{
					case Microsoft.Win32.RegistryValueKind.String:
					case Microsoft.Win32.RegistryValueKind.ExpandString:
						Ketarin.Forms.LogDialog.Log(valueName + " = " + (o as String));
						Microsoft.Win32.Registry.SetValue(rootName + @"\" + keyName, valueName, (o as String));
						break;
					case Microsoft.Win32.RegistryValueKind.Binary:
						byte[] valueByte = System.Text.Encoding.ASCII.GetBytes((o as String));
						Ketarin.Forms.LogDialog.Log(valueName + " = " + (o as String).Replace("\0", " "));
						Microsoft.Win32.Registry.SetValue(rootName + @"\" + keyName, valueName, valueByte, Microsoft.Win32.RegistryValueKind.Binary);
						break;
					case Microsoft.Win32.RegistryValueKind.DWord:
						Ketarin.Forms.LogDialog.Log(valueName + " = " + (Int32)o);
						Microsoft.Win32.Registry.SetValue(rootName + @"\" + keyName, valueName, (Int32)o, Microsoft.Win32.RegistryValueKind.DWord);
						break;
					case Microsoft.Win32.RegistryValueKind.QWord:
						Ketarin.Forms.LogDialog.Log(valueName + " = " + (Int64)o);
						Microsoft.Win32.Registry.SetValue(rootName + @"\" + keyName, valueName, (Int64)o, Microsoft.Win32.RegistryValueKind.QWord);
						break;
					case Microsoft.Win32.RegistryValueKind.MultiString:
						Ketarin.Forms.LogDialog.Log(valueName + " = " + (string[])o);
						Microsoft.Win32.Registry.SetValue(rootName + @"\" + keyName, valueName, (string[])o, Microsoft.Win32.RegistryValueKind.MultiString);
						break;
					default:
						Ketarin.Forms.LogDialog.Log("Value = (Unknown)");
						break;
				}
			}
		}
		catch(Exception ex)
		{
			Abort(ex.ToString());
		}
		
        return true;
	});

/// <summary>
/// Deletes the specified value from this key.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <param name="valueName">The name of the value to delete. A registry key can have one value that is not associated with any name. When this unnamed value is displayed in the registry editor, the string "(Default)" appears instead of a name. To delete this unnamed value, specify either null or the empty string ("") for name.</param>
/// <returns></returns>
Func<string, string, string, bool> RegDeleteValue = new Func<string, string, string, bool>( (rootName, keyName, valueName ) =>
	{
		try
		{
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			Ketarin.Forms.LogDialog.Log("RegDeleteValue(" + rootName + ", " + keyName + ", " + valueName + ")");
		
			using (localKey)
			{
				if (localKey != null)
				{
					if (localKey.GetValue(valueName) != null) // Value exists
					{
						localKey.DeleteValue(valueName);
					}
				}
			}
		}
		catch(Exception ex)
		{
			Abort(ex.ToString());
		}
		
		return true;
	});

/// <summary>
/// Retrieves an array of strings that contains all the subkey names.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <returns>An array of strings that contains the names of the subkeys for the current key. This method does not recursively find names. It returns the names on the base level from which it was called.</returns>
Func<string, string, string[]> RegGetSubKeyNames = new Func<string, string, string[]>( (rootName, keyName) =>
    {
		try
		{
			string[] subKeys;
			bool LogDebug = false;
			
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			if (LogDebug)
			{
				Ketarin.Forms.LogDialog.Log("RegGetSubKeyNames(" + rootName + ", " + keyName + ")");
			}
			
			using (localKey)
			{
				if (localKey != null)
				{
					subKeys = localKey.GetSubKeyNames();
					if (LogDebug)
					{
						Ketarin.Forms.LogDialog.Log("RegGetSubKeyNames Length: " + subKeys.Length); 
					}
					
					for (int i = 0; i <= subKeys.Length -1; i++)
					{
						subKeys[i] = keyName + @"\" + subKeys[i];
					}
					return subKeys;
				}
				else
				{
					if (LogDebug)
					{
						Ketarin.Forms.LogDialog.Log("RegGetSubKeyNames Length: Empty (0)");
					}
					// Abort("Key " + rootName + @"\" + keyName + " not found.");
				}
			}
		}
		catch (Exception ex)
		{
			Abort(ex.ToString());
		}
		
		return null;
	});

/// <summary>
/// Retrieves an array of strings that contains all the subkey names and any child subkeys names recursively.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <returns>An array of strings that contains the names of the subkeys and any child subkeys for the current key.</returns>
Func<string, string, string[]> RegGetAllSubKeyNames = new Func<string, string, string[]>( (rootName, keyName) =>
    {
		try
		{
			int index = 0;
			string[] subKeys = new string[index];
			string tempFileName = System.IO.Path.GetTempFileName();
			string previousKeyName = keyName;
			bool LogDebug = false;
			
			RegGetAllSubKeysStart:
			if (LogDebug)
			{
				using (System.IO.StreamWriter outfile = new System.IO.StreamWriter(tempFileName, true))
				{
					outfile.Write("\r\nRegGetAllSubKeyNames[" + index + "](" + rootName + ", " + keyName + ")\r\n");
				}
				Ketarin.Forms.LogDialog.Log("RegGetAllSubKeyNames[" + index + "](" + rootName + ", " + keyName + ")");
			}
			
			string[] subkeynames;
			subkeynames = RegGetSubKeyNames(rootName, keyName);
			
			if (subkeynames == null || subkeynames.Length <= 0) //has no more subkey, process
			{
				goto RegGetAllSubKeysForEach;
			}
			
			string subKeyName = keyName.Substring(previousKeyName.Length, keyName.Length - previousKeyName.Length);
			if (LogDebug)
			{
				Ketarin.Forms.LogDialog.Log("RegGetAllSubKeyNames subKeyName.Substring = " + subKeyName);	
			}
			
			foreach (string key in subkeynames) //has subkeys, go deeper
			{
				keyName = previousKeyName + subKeyName + @"\" + key;
				Array.Resize(ref subKeys, subKeys.Length + 1);
				subKeys[subKeys.Length - 1] = keyName;
				
				if (LogDebug)
				{
					using (System.IO.StreamWriter outfile = new System.IO.StreamWriter(tempFileName, true))
					{
						outfile.Write(subKeys[subKeys.Length - 1] + "\r\n");
					}
					Ketarin.Forms.LogDialog.Log(subKeys[subKeys.Length - 1]);
				}
			}
			
			RegGetAllSubKeysForEach:
			if (index < subKeys.Length)
			{
				keyName = subKeys[index];
				index += 1;
				goto RegGetAllSubKeysStart;
			}
			
			if (LogDebug)
			{
				Ketarin.Forms.LogDialog.Log("subKeys.Length = " + subKeys.Length);
			}
			return subKeys;
		}
		catch (Exception ex)
		{
			Abort(ex.ToString());
		}
		
		return null;
	});

/// <summary>
/// Retrieves an array of strings that contains all the value names associated with this key.
/// </summary>
/// <param name="rootName">The HKEY to open.</param>
/// <param name="subKeyName">The name or path of the subkey to open. This string is not case-sensitive.</param>
/// <returns>An array of strings that contains the value names for the current key. If no value names for the key are found, an empty array is returned. A registry key can have a default value — that is, a name/value pair in which the name is the empty string (""). If a default value has been set for a registry key, the array returned by the GetValueNames method includes the empty string.</returns>
Func<string, string, string[]> RegGetValueNames = new Func<string, string, string[]>( (rootName, keyName) =>
    {
		try
		{
			string[] valueNames;
			bool LogDebug = false;
			
			Microsoft.Win32.RegistryKey localKey = RegOpenSubKey(rootName);
			localKey = localKey.OpenSubKey(keyName);
			if (LogDebug)
			{
				Ketarin.Forms.LogDialog.Log("RegGetValueNames(" + rootName + ", " + keyName + ")");
			}
			
			using (localKey)
			{
				if (localKey != null)
				{
					valueNames = localKey.GetValueNames();
					if (LogDebug)
					{
						Ketarin.Forms.LogDialog.Log("RegGetValueNames Length: " + valueNames.Length); 
					}
					return valueNames;
				}
				else
				{
					if (LogDebug)
					{
						Ketarin.Forms.LogDialog.Log("RegGetValueNames Length: 0");
					}
					// Abort("Key " + rootName + @"\" + keyName + " not found.");
				}
			}
		}
		catch (Exception ex)
		{
			Abort(ex.ToString());
		}
		
		return null;
	});

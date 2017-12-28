# RegClassCS

[![license](https://img.shields.io/github/license/coldscientist/regclasscs.svg?maxAge=2592000)](https://github.com/coldscientist/regclasscs/blob/master/LICENSE)

C# Registry functions for [Ketarin](http://ketarin.canneverbe.com).

## Usage

### RegSetValue

	RegSetValue(rootName, keyName, valueName, o, typeName);

	RegSetValue("HKEY_CURRENT_USER", @"Software\Microsoft\Windows\CurrentVersion\Uninstall\5f7eb300e2ea4ebf", "ShortcutAppId", "github-windows.s3.amazonaws.com", "REG_SZ");

### RegDeleteValue
	
	RegDeleteValue("HKEY_CURRENT_USER", @"Software\Microsoft\Windows\CurrentVersion\Uninstall\5f7eb300e2ea4ebf", "ShortcutAppId");
	
### RegCreateKey

	string SideBySide = @"Software\Classes\Software\Microsoft\Windows\CurrentVersion\Deployment\SideBySide\2.0";

	RegCreateKey("HKEY_CURRENT_USER", SideBySide);

### RegDeleteKey

	RegDeleteKey("HKEY_CURRENT_USER", @"PLEASE\BE\CAREFUL");

### RegGetAllSubKeyNames, RegGetValueNames, RegGetValue, RegGetValueKind

	string SideBySide = @"Software\Classes\Software\Microsoft\Windows\CurrentVersion\Deployment\SideBySide\2.0";

	string[] subKeyNames = RegGetAllSubKeyNames("HKEY_CURRENT_USER", SideBySide);
	Array.Reverse(subKeyNames);
	for(int i = 0; i <= subKeyNames.Length - 1; i++)
	{
		string[] valueNames = RegGetValueNames("HKEY_CURRENT_USER", subKeyNames[i]);
		foreach(string valueName in valueNames)
		{
			string valueKind = RegGetValueKind("HKEY_CURRENT_USER", subKeyNames[i], valueName);
			switch(valueKind)
			{
				case "REG_SZ":
				case "REG_EXPAND_SZ":
				case "REG_BINARY":
					string valueSZ = (RegGetValue("HKEY_CURRENT_USER", subKeyNames[i], valueName) as String);
					break;
					
				case "REG_MULTI_SZ":
					string[] valueMultiSZ = (string[])RegGetValue("HKEY_CURRENT_USER", subKeyNames[i], valueKind);
					
					for(int k = 0; k <= valueMultiSZ.Length - 1; k++)
					{
						Ketarin.Forms.LogDialog.Log("valueMultiSZ[" + k + "] = " + valueMultiSZ[k]);
					}
					break;
				
				default:
					break;
			}
		}
	}

## Building docs

You can build docs using [Natural Docs](http://www.naturaldocs.org).

```
NaturalDocs.exe RegClassCS\docs -do
```
	
## License

GNU [GPLv3](LICENSE) License.

## Contributors

* Anthony Roach - [QuickRegistry](https://www.codeproject.com/Articles/3000/Quick-Registry-class-in-C)
	

# Changed files detection for VSTS

This extension will set a variable to the value `true` if files are changed in a particular folder in the current commit.
In case the files are not changes, the variable will get the value `false`.

With this extension it is possible to have a single build that creates multiple NuGet packages. 
This will prevent updating packages when there are no changes in it.

## Prerequisites
To be able to use this extension, the OAuth token should be shared to tasks in the build definition.
1. Edit the build definition where the extension is added.
2. Click on the Phase that has the task.
3. Enable the checkbox "Allow scripts to access OAuth token".

## Settings of the build task
Folder with changes  
Select here the folder that needs to be checked for changes. If this folder has any change in a file, the variable will be set.

Variable name  
The name of the variable that will be set to `true` or `false`, depending if there are changes in the selected folder.

Always update variable  
Option to force the update of the defined variable. If there are no changed, the value will be set to `false` when this option is checked. 
Otherwise the variable will only be set in case of changes (with value `true`). 
This is useful when having existing variables set by starting a build.
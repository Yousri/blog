---
date: 2024-02-10
title:  Install Flutter SDK and Android SDK on Ubuntu
tags:
- Flutter
- Android SDK
description: Install Flutter SDK and Android SDK on Ubuntu for develop Android App.
---
# Install Flutter SDK and Android SDK on Ubuntu for develop Android App

## System Setup  
* Maybe need tools  
```bash
apt-get install unzip clang cmake git ninja-build pkg-config libgtk-3-dev liblzma-dev libstdc++-12-dev
apt remove android-sdk
apt install openjdk-17-jdk
```
*  Set the `JAVA_HOME` variable in the environment to match the location of Java installation.
```bash
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64/"
```
## Install the Flutter SDK
* Download the flutter sdk package from [SDK archive](https://docs.flutter.dev/release/archive),for example the latest stable release version is 3.19.4
```bash
wget -c https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.19.4-stable.tar.xz
```
* Extract the zip package into the directory want to store the Flutter SDK, like `/opt/flutter`.
```bash
mv flutter_linux_3.19.4-stable.tar.xz /opt/
tar zxf flutter_linux_3.19.4-stable.tar.xz
```
When finished, the Flutter SDK should be in the `/opt/flutter` directory.
* you need configure `Android Development`  
create android app with flutter,need installed the following android components:  
  * Android SDK Platform, API  
  * Android SDK Command-line Tools  
  * Android SDK Build-Tools  
  * Android SDK Platform-Tools  
  * Android Emulator  

## Install and Setting Android SDK
* Download the latest `command line tools only` package from the `Android Studio` [downloads page](https://developer.android.com/studio?pkg=tools).
```bash
wget -c https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
```
* unzip the package to the `Android SDK` dir  
```bash
mkdir -p /opt/android-sdk/cmdline-tools
mv commandlinetools-linux-11076708_latest.zip /opt/android-sdk/cmdline-tools/
cd /opt/android-sdk/cmdline-tools
unzip commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest
# the prefix path is like /opt/android-sdk/cmdline-tools/latest
```
* To install a previous version of the command-line tools, you can use `sdkmanager`,command like: (Optional)
```bash
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --install "cmdline-tools;version"
#Substitute version with the version want to install, for example 6.0
```
So,CI server not need install `Android Studio` and just install `command line tools` include `sdkmanager` to manager the other SDK package and setting SDK tools to build app.  
* Install `Android SDK Platform Tools`
use sdkmanager  
```bash
sdkmanager --list
sdkmanager --install build;33.0.0
sdkmanager --install platform-tools
sdkmanager --install emulator
```
In addition to downloading from the SDK Manager, you can download the SDK Platform Tools from [here](https://developer.android.google.cn/tools/releases/platform-tools#downloads.html) 
```bash
wget -c https://dl.google.com/android/repository/platform-tools_r35.0.0-linux.zip
```

## Environment Variables Setting
```bash
# Android SDK
export ANDROID_HOME=/opt/android-sdk
export PATH="$PATH::/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platforms"
# Flutter SDK
export FLUTTER_HOME=/opt/flutter
#export FLUTTER_HOME=/opt/flutter3.16.5
export PATH="$PATH:/opt/flutter/bin::/opt/flutter3.16.5/bin"
```

## References
[Install Flutter on Linux](https://docs.flutter.dev/get-started/install/linux/android?tab=virtual)  
[Command-line-tools](https://developer.android.google.cn/tools)  
[sdkmanager](https://developer.android.google.cn/tools/sdkmanager)  
[cmdline-tools with JDK](https://micro.blog.csdn.net/article/details/134024106)

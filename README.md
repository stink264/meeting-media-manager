# Welcome!

JW Meeting Media Fetcher, or JWMMF for short, is an app that facilitates the downloading of media that will be considered during congregation meetings of Jehovah's Witnesses. This is especially useful when using JW Library is not possible or feasible for various reasons, during personal study, or to share media with others during congregation Zoom meetings.

![Media sync in progress](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/00-hero.gif?raw=true)

## Installation and usage

Simply download the latest installer [from here](https://github.com/sircharlo/jw-meeting-media-fetcher/releases/latest) and run it.

> **Trouble installing?** Check the *Technical usage notes* section for help.

Once the setup is complete, a shortcut to the app will be placed on your desktop. Open the app, and configure the settings as you please.

After configuring the app, simply go to the [main screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/01-main.png?raw=true) and push the big blue button to sync media. All downloaded media will be placed in the folder of your choosing.

## Configuration

Most of the options in the [Settings screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/02-settings.png?raw=true) are self-explanatory, but here are a few additional details about some of them.

**Enable button to play Kingdom songs on shuffle:** Shows a button which will play Kingdom songs in random order. This is  useful to play songs before and after meetings at the Kingdom Hall.

**Offer to import additional media files:** If enabled, you'll be presented with the [Additional media screen](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/03-upload.png?raw=true) when performing a media sync. This allows you to import additional media files into the week's media. There are 3 types of media you can import.
- **Song:** Choose this to add a song, for example for a public talk. After choosing the song number, it will be downloaded for you.
- **JWPUB:** Choose this to automatically import the media files from a JWPUB file, such as the S-34, or any other JWPUB file that contains media. Upon choosing the JWPUB file, you will be prompted to choose what media you'd like to import.
- **Custom:** Choose this to select any other media file from your computer.

**Convert media to MP4 format:** This automatically converts all picture and audio files into MP4 format. This includes files downloaded from JW.org, as well as files imported using the "import additional media files" feature mentioned above, if enabled. This allows those files to be shared in Zoom using its [native MP4 sharing feature](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/05-zoom.png?raw=true), rather than sharing your local monitor or your media playback app's window.

> **Why do it this way?** As explained by this Zoom [support article](https://support.zoom.us/hc/en-us/articles/360051673592-Sharing-and-playing-a-video), "video files can be opened within Zoom’s built-in video player and shared, without other participants viewing the playback controls. Sharing your video with the built-in player, instead of as part of a shared screen or application, improves the quality of shared videos, providing a smoother and more stable viewing experience for your viewers."

**Congregation-level media syncing (☁️):** The brother designated as _videoconference organizer_ (VO) by the body of elders can use JWMMF to manage what media will be available to the person or team taking care of media for any given meeting. For example, he can:

- upload additional media to be shared during a meeting (such as for the circuit overseer's visit, or for public speakers' talks)
- hide media that for one reason or another is not relevant for a given meeting (for example, when a part has been replaced by another one by the local branch)
- make recurring media available, to be shared at every meeting (such as a yeartext video, or an announcement slide)

> **Note:** Usage of the congregation-level media syncing features is, of course, entirely optional. No data is shared or uploaded to me or to any external parties in the process. The underlying congregation-level syncing mechanism uses WebDAV, and therefore simply requires the VO (or someone under his supervision) to maintain a secured WebDAV server. All users from a congregation that wish to be synchronized together should connect to the VO's WebDAV server using the connection information that he provides them. To do so, go to Settings, then click on the **☁️** button.

## Does this app depend on external sites, sources or curators to download publications and meeting media?

**No.** The app behaves similarly to JW Library. It downloads data such as publications and media directly from one source only: the official JW website and its content delivery network. Files that should be downloaded, such as media and publications, are automatically determined at runtime. The source code is available for all to examine and verify this.

## Does this app infringe the JW.org Terms of Use?

**No.** The JW.org [Terms of Use](https://www.jw.org/en/terms-of-use) actually *explicitly allow* the kind of usage that we are making. Here is the relevant excerpt from those terms (emphasis mine):

>You may not:
>
> Create for distribution purposes, any software applications, tools, or techniques that are specifically made to collect, copy, download, extract, harvest, or scrape data, HTML, images, or text from this site. (This does *not* prohibit the distribution of free, non-commercial applications designed to download electronic files such as EPUB, PDF, MP3, and MP4 files from public areas of this site.)

## Technical usage notes
The app should run as is on most modern computers running Windows, Linux, or Mac.

##### Windows
On opening the installer, you might get [an error](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/07-win-smartscreen.png?raw=true) indicating that "Windows SmartScreen prevented an unrecognized app from starting". This is due to the app not having a high number of downloads, and consequently not being explicitly "trusted" by Windows. To get around this, simply click on "More info", then "Run anyway".
##### Linux
As per the [official AppImage documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html):

> AppImages based on Electron require the kernel to be configured in a certain way to allow for its sandboxing to work as intended (specifically, the kernel needs to be allowed to provide “unprivileged namespaces”). Many distributions come with this configured out of the box (like Ubuntu for instance), but some do not (for example Debian).

Simply put, this means that if the AppImage fails to open properly, then you'll need to confirm the output of the following command:

`sysctl kernel.unprivileged_userns_clone`

If the output is `kernel.unprivileged_userns_clone = 0`, then the AppImage will not run unless you run the following command and then reboot:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Before you do this however, make sure you read up on what this change entails, for example [here](https://lwn.net/Articles/673597/).

##### Mac
For technical reasons, the auto-updater does not work on Macs. Mac users will instead see a red, pulsing notification on the main screen of the app and in Settings when an update is available. Clicking on the notification in Settings will open the latest release's download page automatically.

Additionally, if upon launching the app, you receive [a message](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/06-mac-error.png?raw=true) indicating that you "do not have permission to open the application", then try running this command in Terminal:

`codesign --force --deep --sign - "/path/to/JW Meeting Media Fetcher.app"`

## Help, there's a problem

If ever you run into any issues with the app or the underlying script, please use [GitHub Issues](https://github.com/sircharlo/jw-meeting-media-fetcher/issues) to let me know.

## I have an idea for a great new feature!

I'm open to suggestions! Please use [GitHub Discussions](https://github.com/sircharlo/jw-meeting-media-fetcher/discussions) to let me know.

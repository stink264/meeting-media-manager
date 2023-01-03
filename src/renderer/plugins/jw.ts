// eslint-disable-next-line import/named
import { existsSync, readFileSync, statSync } from 'fs-extra'
import { join } from 'upath'
import { Plugin } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import { JW_ICONS_FONT, WT_CLEARTEXT_FONT } from './../constants/general'
import { Filter, JWLang, ShortJWLang } from '~/types'

const plugin: Plugin = (
  {
    $appPath,
    $write,
    $getPrefs,
    $ytPath,
    $log,
    $axios,
    $warn,
    $localFontPath,
    $setPrefs,
    $dayjs,
    store,
  },
  inject
) => {
  async function getJWLangs(forceReload = false): Promise<ShortJWLang[]> {
    const langPath = join($appPath(), 'langs.json')
    const lastUpdate = $getPrefs('media.langUpdatedLast') as string
    const recentlyUpdated =
      lastUpdate && $dayjs(lastUpdate).isAfter($dayjs().subtract(3, 'months'))

    if (forceReload || !existsSync(langPath) || !recentlyUpdated) {
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://www.jw.org/en/languages',
        })

        if (result.languages) {
          const langs = (result.languages as JWLang[])
            .filter((lang) => lang.hasWebContent)
            .map((lang) => {
              return {
                name: lang.name,
                langcode: lang.langcode,
                symbol: lang.symbol,
                vernacularName: lang.vernacularName,
                isSignLanguage: lang.isSignLanguage,
              } as ShortJWLang
            })
          $write(langPath, JSON.stringify(langs, null, 2))
          $setPrefs('media.langUpdatedLast', $dayjs().toISOString())
        } else {
          $log.error(result)
        }
      } catch (e: unknown) {
        if (!store.state.stats.online) {
          $warn('errorOffline')
        } else {
          $log.error(e)
        }
      }
    }

    if (!existsSync(langPath)) {
      return getJWLangs(true)
    }

    let langs: ShortJWLang[] = []

    function readLangs(firstTry = true): string {
      try {
        const fileContent = readFileSync(langPath, 'utf8')
        return fileContent
      } catch (e: unknown) {
        if (firstTry) {
          return readLangs(false)
        } else {
          $log.error(e)
          return ''
        }
      }
    }

    const fileContent = readLangs()
    if (fileContent) {
      try {
        langs = JSON.parse(fileContent) as ShortJWLang[]
      } catch (e: any) {
        if (e.message.includes('Unexpected token')) {
          $log.debug(`Invalid JSON: ${fileContent}`)
          return getJWLangs(true)
        } else {
          $log.error(e)
        }
      }
    }

    const mediaLang = $getPrefs('media.lang') as string
    const fallbackLang = $getPrefs('media.langFallback') as string
    const langPrefInLangs = langs.find((lang) => lang.langcode === mediaLang)
    const fallbackLangObj = langs.find((lang) => lang.langcode === fallbackLang)

    // Check current lang if it hasn't been checked yet
    if (
      mediaLang &&
      langPrefInLangs &&
      (langPrefInLangs.mwbAvailable === undefined ||
        langPrefInLangs.mwbAvailable === undefined)
    ) {
      const availability = await getPubAvailability(mediaLang)
      langPrefInLangs.wAvailable = availability.w
      langPrefInLangs.mwbAvailable = availability.mwb
    }

    if (
      fallbackLang &&
      fallbackLangObj &&
      (fallbackLangObj.mwbAvailable === undefined ||
        fallbackLangObj.mwbAvailable === undefined)
    ) {
      const availability = await getPubAvailability(fallbackLang)
      fallbackLangObj.wAvailable = availability.w
      fallbackLangObj.mwbAvailable = availability.mwb
    }

    store.commit('media/setMediaLang', langPrefInLangs ?? null)
    store.commit('media/setFallbackLang', fallbackLangObj ?? null)
    store.commit(
      'media/setSongPub',
      langPrefInLangs?.isSignLanguage ? 'sjj' : 'sjjm'
    )

    $write(langPath, JSON.stringify(langs, null, 2))

    return langs
  }
  inject('getJWLangs', getJWLangs)

  async function getPubAvailability(
    lang: string,
    refresh = false
  ): Promise<{ lang: string; w?: boolean; mwb?: boolean }> {
    let mwb
    let w

    $log.debug(`Checking availability of ${lang}`)

    const url = (cat: string, filter: string, lang: string) =>
      `https://www.jw.org/en/library/${cat}/json/filters/${filter}/?contentLanguageFilter=${lang}`

    try {
      const langPath = join($appPath(), 'langs.json')
      const langs = JSON.parse(
        readFileSync(langPath, 'utf8') ?? '[]'
      ) as ShortJWLang[]

      const langObject = langs.find((l) => l.langcode === lang)
      if (!langObject) return { lang, w, mwb }
      if (
        !refresh &&
        langObject.mwbAvailable !== undefined &&
        langObject.wAvailable !== undefined
      ) {
        return { lang, w: langObject.wAvailable, mwb: langObject.mwbAvailable }
      }

      const wAvailabilityEndpoint = url(
        'magazines',
        'MagazineViewsFilter',
        langObject.symbol
      )
      const mwbAvailabilityEndpoint = url(
        'jw-meeting-workbook',
        'IssueYearViewsFilter',
        langObject.symbol
      )

      const result = await Promise.allSettled([
        ipcRenderer.invoke('getFromJWOrg', {
          url: mwbAvailabilityEndpoint,
        }) as Promise<Filter>,
        ipcRenderer.invoke('getFromJWOrg', {
          url: wAvailabilityEndpoint,
        }) as Promise<Filter>,
      ])

      const mwbResult = result[0]
      const wResult = result[1]

      if (mwbResult.status === 'fulfilled') {
        if (mwbResult.value.choices) {
          mwb = !!mwbResult.value.choices.find(
            (c) => c.optionValue === new Date().getFullYear()
          )
        } else {
          $log.error(mwbResult.value)
        }
      }
      if (wResult.status === 'fulfilled') {
        if (wResult.value.choices) {
          w = !!wResult.value.choices.find((c) => c.optionValue === 'w')
        } else {
          $log.error(wResult.value)
        }
      }

      langObject.mwbAvailable = mwb
      langObject.wAvailable = w
      $write(langPath, JSON.stringify(langs, null, 2))
    } catch (e: unknown) {
      $log.error(e)
    }

    return { lang, mwb, w }
  }

  inject('getPubAvailability', getPubAvailability)

  // Get yeartext from WT online library
  async function getYearText(
    force = false,
    lang?: string
  ): Promise<string | null> {
    let yeartext = null

    const fallbackLang = $getPrefs('media.langFallback') as string | null
    const wtlocale = lang ?? ($getPrefs('media.lang') as string | null)
    if (!wtlocale) return null
    const ytPath = $ytPath(lang)

    if (force || !existsSync(ytPath)) {
      $log.debug('Fetching yeartext', wtlocale)
      const fontsPromise = getWtFonts()
      try {
        const result = await ipcRenderer.invoke('getFromJWOrg', {
          url: 'https://wol.jw.org/wol/finder',
          params: {
            docid: `110${new Date().getFullYear()}800`,
            wtlocale,
            format: 'json',
            snip: 'yes',
          },
        })
        if (result.content) {
          yeartext = JSON.parse(JSON.stringify(result.content)) as string
          $write(ytPath, yeartext)
        } else if (result.message === 'Request failed with status code 404') {
          if (fallbackLang && wtlocale !== fallbackLang) {
            return await getYearText(force, fallbackLang)
          } else {
            $warn('errorYeartextNotFound', { identifier: wtlocale })
          }
        } else {
          $log.error(result)
        }
      } catch (e: any) {
        if (
          fallbackLang &&
          wtlocale !== fallbackLang &&
          e.message === 'Request failed with status code 404'
        ) {
          $log.warn(`Yeartext not found for ${wtlocale}`)
          return await getYearText(force, fallbackLang)
        } else {
          $log.error(e)
        }
      }
      await fontsPromise
    } else {
      try {
        yeartext = readFileSync(ytPath, 'utf8')
      } catch (e: unknown) {
        $warn('errorOffline')
      }
    }
    return yeartext
  }
  inject('getYearText', getYearText)

  async function getWtFonts() {
    const fonts = [WT_CLEARTEXT_FONT, JW_ICONS_FONT]

    const promises: Promise<void>[] = []

    fonts.forEach((font) => {
      promises.push(getWtFont(font))
    })

    await Promise.allSettled(promises)
  }

  async function getWtFont(font: string) {
    const fontPath = $localFontPath(font)
    let size = -1

    try {
      const result = await $axios.request({
        method: 'HEAD',
        url: font,
      })

      size = +result.headers['content-length']
    } catch (e: unknown) {
      $log.error(e)
    }

    if (!existsSync(fontPath) || statSync(fontPath).size !== size) {
      try {
        const result = await $axios.$get(font, {
          responseType: 'arraybuffer',
        })
        if (result instanceof ArrayBuffer || result instanceof Uint8Array) {
          $write(fontPath, Buffer.from(new Uint8Array(result)))
        } else {
          $log.error(result)
        }
      } catch (e: unknown) {
        $log.error(e)
      }
    }
  }
}

export default plugin

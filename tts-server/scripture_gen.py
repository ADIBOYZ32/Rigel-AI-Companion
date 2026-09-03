import asyncio
import edge_tts
import os

VOICE = "en-IN-NeerjaNeural"
OUTPUT_FILE = "hanuman_chalisa_full.mp3"

# 🐝 THE BEE-PROTOCOL:
# We use 'Bee-' and 'Barr' prefixes to stop English hallucinations like "Burger" or "Sanji".
# Hard consonants ('Pud', 'Pud') force stops.
TEXT = """
Shree Gu-roo Cha-run Sa-roj Raa-ajj. Nijj mun mu-kurr su-dhaar.
Bur-nau Ra-ghu-barr Bee-mull Jaa-soo. Jo da-ya-ku phull chaar.

Budh-hee-heen Ta-nu Jaa-nee-kay. Su-mee-rau Pa-bunn Ku-maar.
Bal budh-hee Beed-yaa de-hu mo-hay. Ha-ra-hu Ka-lay-sha Bee-kaar.

Jai Ha-nu-maan gya-na gun saa-gur. Jai Ka-pee-ees tee-hoon lok oo-jaa-gur.
Raam doot a-tu-lit bul dhaa-ma. Ann-jaa-nee Poot-trah Pa-bunn sut naa-ma.

Ma-haa-bee-er Bik-rum Buj-rung-ee. Ku-ma-ti ni-baar su-ma-ti Kay sung-ee.
Kunn-chun ba-run bee-raaj su-bay-sa. Kaa-nun Kun-dul Keen-chit Kay-sa.

Haath Budj-ra au Dhwa-ja Bee-ra-jay. Kaan-dhay moonj ja-nay-u sa-jay.
Shun-kar su-bunn Ke-sa-ri Nun-dan. Tej pra-tap ma-ha jag vun-dun.

Beed-ya-baan gu-nee ati cha-tur. Raam kaaj ka-ree-bay ko aa-tur.
Pra-bu cha-rit-ra su-nee-bay ko ra-si-ya. Raam Lakh-un See-ta mun Ba-si-ya.

Sook-shma roop dha-ri See-ya-hi dee-kha-ba. Bee-kut roop dha-ri lun-ka ja-ra-ba.
Bhee-ma roop dha-ri a-sur sun-ha-ray. Ram-chun-dra kay kaaj sun-baa-ray.

La-ye Sun-jee-bunn La-khun Jee-ya-ye. Shree Ra-ghu-beer Har-shi ur la-ye.
Ra-ghu-pa-ti Keen-hi ba-hut ba-dai. Tum mum pri-ye Bha-rat-hi sum bhai.

Sa-has ba-dan tum-ha-ro yush ga-bay. Us ka-he Shree-pa-ti kunth la-ga-bay.
San-ka-dik Brah-ma-dee Mu-ne-sa. Na-rud Sa-rud sa-hit A-he-sa.

Yum Ku-ber Dig-pal Ja-hun te. Ka-bee ko-beed ka-he sa-ke ka-hun te.
Tum up-kaar Sug-re-ba-hin keen-ha. Ram mi-la-yay raaj-pud deen-ha.

Tum-ha-ro mun-tra Bee-bhee-shun ma-na. Lan-kesh-war Bha-yay Sub jag ja-na.
Yug sa-has-tra jo-jan par Bha-nu. Le-lyo ta-he mad-hur phull ja-nu.

Pra-bhu mud-ri-ka me-li mukh ma-he. Ja-la-dhi lun-ghi ga-ye ach-raj na-he.
Dur-ga-am kaaj ja-gut ke je-te. Su-gum a-nu-gra-ha tum-re te-te.

Ram dwa-re tum rakh-ba-re. Ho-at na a-gya bee-nu pai-sa-re.
Sub sukh la-hai tum-ha-ri sar-na. Tum rak-shak ka-hu ko dur na.

Aa-pun tej sa-ma-ha-ro aa-pai. Teen-hon lok hank te kun-pai.
Bhoot pi-saach Ni-kut na-hin a-bai. Ma-ha-be-er jab naam su-na-bay.

Na-se rog ha-re sub pe-ra. Ja-pat ni-run-tar Ha-nu-munt be-ra.
Sun-kat se Ha-nu-man chu-da-bai. Mun Ka-rum Ba-chun dyan jo la-bai.

Sub par Raam ta-pus-vee ra-ja. Tin ke kaaj sa-kal Tum sa-ja.
Aur ma-no-ruth jo ko-ye la-bai. So-hi a-mit ji-ban phull pa-bai.

Cha-ron Yug par-tap tum-ha-ra. Hai per-sidh ja-gat u-ji-ya-ra.
Sa-dhu Sunt ke tum Rakh-ba-re. A-sur ni-kun-dun Raam du-lha-re.

Ash-ta sid-hi nav ni-dhi ke dhaa-ta. Us bur deen Jan-ki ma-ta.
Ram ra-sa-yun tum-ha-re paa-sa. Sa-da ra-ho Ra-ghu-pa-ti ke da-sa.

Tum-ha-re bha-jan Ram ko paa-bai. Ja-nam ja-num kay dukh bis-ra-bai.
Anth kaal Ra-ghu-beer pur ja-ye. Ja-hun ja-num Ha-ri-Bhak-tu Ka-ha-ye.

Aur Deb-ta Chit na dha-re-hi. Ha-nu-mun-th se hi sar-be sukh ka-re-hi.
Sun-kat ka-te mi-te sab pe-ra. Jo su-mi-re Ha-nu-mut Bal-be-ra.

Jai Jai Jai Ha-nu-man Go-sa-ye. Kri-pa Ka-ra-hu Gu-ru-deb ki nya-ye.
Jo sat bar path ka-re ko-he. Chu-te-hi ban-dhi ma-ha sukh ho-he.

Jo yah pa-dhe Ha-nu-man Cha-li-sa. Ho-ye sid-dhi sa-khi Gau-re-sa.
Tul-si-das sa-da ha-ri che-ra. Ki-jai Das Her-da-yay mein de-ra.

Pavan-tu-nai san-kat ha-run, Mun-gal mur-ti roop. Raam La-khun See-ta sa-hit, Her-da-yay ba-sa-hu sur bhoop.

Shree Raam Jai Raam Jai Jai Raam. 
Shree Raam Jai Raam Jai Jai Raam. 
Shree Raam Jai Raam Jai Jai Raam. 
Shree Raam Jai Raam Jai Jai Raam. 
"""

async def generate_scripture():
    print(f"🧬 Manifesting THE FULL SCRIPTURE (Bee-Protocol +50% Speed)...")
    # Rate +50% for high-speed deity profile.
    communicate = edge_tts.Communicate(TEXT, VOICE, rate="10%", pitch="+15Hz")
    await communicate.save(OUTPUT_FILE)
    print(f"✅ FINAL PROTOCOL COMPLETE.")
    print(f"📁 Path: {os.path.abspath(OUTPUT_FILE)}")

if __name__ == "__main__":
    asyncio.run(generate_scripture())

    #Zenith's voice.

    #voice = "en-US-BrianNeural"
    #rate = "-12%"   
    #pitch = "-25Hz"


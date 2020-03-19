Attribute VB_Name = "InSTaScrapeV1"
Sub operaSoccerMatch()

'Moral of the story u can't use the LocationUrl to do error handling.


Arse = "https://www.instagram.com/dopplegooner/"
'"https://www.instagram.com/mahirahkhan/"
'"https://www.instagram.com/sibin_d_gunner/"
'https://www.instagram.com/accounts/login/
'_ah57t _84y62 _i46jh _rmr7s
'https://fantasy.premierleague.com/a/team/235579/event/38
'document.getElementsByClassName('_kp5f7 _qy55y')[0].value="xxx"
'document.getElementsByClassName('_kp5f7 _qy55y')[1].value="xxx"
'document.getElementsByClassName('_ah57t _84y62 _i46jh _rmr7s')[0].click()
'"https://www.instagram.com/gmbatharaw/"
'https://www.instagram.com/pooja.pt/
'https://www.instagram.com/dopplegooner/
'https://www.instagram.com/radhika.sekar.353/
'https://www.instagram.com/meenudazzle/
Set ie = CreateObject("InternetExplorer.Application")
ie.navigate Arse

ie.Visible = 1

GoTo hell ' hell is for insta


'ie.navigate "https://fantasy.premierleague.com/a/statistics/cost_change_start"

ie.navigate Arse

ie.Visible = 1
 
MsgBox LocationURL

 'Application.Wait (Now + TimeValue("0:00:12"))
 
 '                document.getElementsByClassName('matches   ')[0].children[1].children[0].children[4].children[0].href
 
 underURnose = ie.document.getElementsByClassName("matches   ")(0).Children(1).Children(0).Children(4).Children(0).href
 
                phogat = Split(underURnose, "id=")
                'http://sports.opera.com/?sport=soccer&page=match&id=2348324&localization_id=www
                ddd = UBound(phogat)
                'Cells(ai + 2, 2) = phogat(5)
                'MsgBox phogat(1)
                zaira = phogat(1)
                '&localization
                zw = Split(zaira, "&localization")
'                MsgBox zw(0)
'                MsgBox Len(zw(0))
'                MsgBox ie.LocationURL
                cc = ie.LocationURL
                
                  'document.getElementsByClassName('nav_description')[0].children[0].click()
                'to click previous
                mos = 0
                
                ie.document.getElementsByClassName("nav_description")(0).Children(1).Click
beforeClick::
   
                nn = ie.LocationURL
                mos = mos + 1
                
                
                If cc = nn Then
                Application.Wait (Now + TimeValue("0:00:1"))
                GoTo beforeClick
                Application.Wait (Now + TimeValue("0:00:1"))
                If mos > 9 Then GoTo hell
                
                
                End If
hell::
            'Stop
            Dim instafollower As String
            
                          'document.getElementsByClassName('_539vh _4j13h')[0].children[274].children[0].children[0].children[1].children[0].innerText
            'document.getElementsByClassName("k9GMp ")[0].children[2].children[0].children[0].innerText
            'Children(0).Children(0).Children(1).Children(0).innerText
            totfollower = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children(2).Children(0).Children(0).innerText
            '\ instatProfName=document.getElementsByClassName('nZSzR')[0].children[0].innerText
            instaProfName = ie.document.getElementsByClassName("nZSzR")(0).Children(0).innerText
            
            ActiveSheet.Name = instaProfName & "-" & totfollower '& "" & Date
            'for following-document.getElementsByClassName('_bkw5z')[2].innerText
            'for posts-document.getElementsByClassName('_bkw5z')[0].innerText
            'for followers=document.getElementsByClassName('_bkw5z')[1].innerText
            'The mistake i learnt from here is ,if u have so much time on manuel work ,den never let ur instinct to run this without any breakpoint,
            'you should be running this wiht breakopoint for some 3-4 iteration and then run in full run mode.
            
            Currtotfollower = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children.Length
            'VERIFIED profiles
                        'document.getElementsByClassName('_d8ttn _soakw coreSpriteVerifiedBadge').length
            instaVerPro = ie.document.getElementsByClassName("_d8ttn _soakw coreSpriteVerifiedBadge").Length
            'Profile Name
                              'document.getElementsByClassName('_i572c notranslate')[0].innerText
            'instaProfName = ie.document.getElementsByClassName("_i572c notranslate")(0).innerText
            Currenttotfollower = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children.Length
            counter = 0
        For infl = 0 To totfollower - 1
            'document.getElementsByClassName('_539vh _4j13h')[0].children.length
            ie.document.parentWindow.scroll 0, 1000
           ' ie.document.getElementsByClassName("_4gt3b")(0).parentWindow.scroll 0, 1000
            'document.getElementsByClassName('_4gt3b')[0]
            'totfollower = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children.Length
            
            instafollower = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children(infl).Children(0).Children(0).Children(1).Children(0).innerText
            instafollowername = ie.document.getElementsByClassName("_539vh _4j13h")(0).Children(infl).Children(0).Children(0).Children(1).Children(1).innerText
            Cells(infl + 2, 2) = instafollower
            aparam = Split(instafollower, vbCr)
'            st = aparam(0)
'            nd = aparam(1)
'            MsgBox UBound(aparam)
            If UBound(aparam) > 0 Then
            
                c = Verified(instafollower)
                counter = counter + c
            End If
            
            
            Cells(infl + 2, 3) = instafollowername
            Cells(infl + 2, 2).Activate
            Range("d3").CurrentRegion.EntireColumn.AutoFit
        Next
            instaProfName = ie.document.getElementsByClassName("_i572c notranslate")(0).innerText
            ActiveSheet.Name = instaProfName & "-" & totfollower '& "" & Date
            Cells(1, 2) = Time & "-" & Date
            Cells(1, 2).Activate
                        Cells(1, 3) = "Verified profile  -" & counter
            
                'MsgBox ie.LocationURL
                
 
End Sub


Function Verified(str As String) As Integer

    aparam = Split(str, vbCr)
    Verified = 1
    


End Function

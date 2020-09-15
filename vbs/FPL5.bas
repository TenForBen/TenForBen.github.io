Attribute VB_Name = "FPL5"
 Sub FPL5()
   
   'Next thing is to update the entryId into a function
   'nameOfPlayer = document.getElementsByClassName("Entry__EntryName-sc-1kf863-0 ldMMkD")[0].innerText
   
   
    Set ie = CreateObject("InternetExplorer.Application")
    CeCC = InputBox("To get the Group Details of Road to glory (Y)")
    'Y/5
    deedee = Split(CeCC, "/")
    ce = UCase(deedee(0))
    If UBound(deedee) > 0 Then
        decider = Trim(deedee(1))
        g2 = "on"
    Else
    'same as usual
    decider = 2
    End If

    daddy = "1013853"
    mommy = "1012340"
    madam = "1015947"
    kp = "1013402"             '18=742312,
    sibin = "1014425"
    sagil = "5478265"          '18-881909,
            
    If ce = "Y" Then
            nishant = "1288683" '`x```
            Rohan = "143864"
            das = "25825"
            
            dipenThapa = "3202275"
            sibin = "1530227"
            kushal = "1808381"
            satyam = "30839"
            ashimlama = "1555875"
            inderjeet = "1507506"
            viveklama = "3171178"
            Prabin = "4363524"
            
            sanjeevkumar = "3732429"
            ashishRai = "6251244"
            ravishVerma = "74211"
            bishalRai = "2517295"
            regeanLama = "2381459"
            hanSingh = "437359"
            ashishSubba = "753323"
            abhijeetSingh = "1009666"
            pranamRai = "1384222"
            PemaSHerpa = "3729374"
            sahilLampard = "2169583"
            RajKanango = "161204"
            ONkarSUbba = "1099725"
            nitishSIng = "947098"
            okendri = "1150009"
            gauravShrestha = "2544322"
            AnkuKumar = "1391491"
            
            Cells(26, 1) = " sanjeevkumar "
            Cells(26, 2) = sanjeevkumar
            Cells(27, 1) = " ashishRai "
            Cells(27, 2) = ashishRai
            Cells(28, 1) = " ravishVerma "
            Cells(28, 2) = ravishVerma
            Cells(29, 1) = " bishalRai "
            Cells(29, 2) = bishalRai
            Cells(20, 1) = " RajKanango "
            Cells(20, 2) = RajKanango
            Cells(21, 1) = " sahilLampard "
            Cells(21, 2) = sahilLampard
            Cells(22, 1) = " PemaSHerpa "
            Cells(22, 2) = PemaSHerpa
            Cells(23, 1) = " pranamRai "
            Cells(23, 2) = pranamRai
            Cells(24, 1) = " regeanLama "
            Cells(24, 2) = regeanLama
            Cells(25, 1) = " hanSingh "
            Cells(25, 2) = hanSingh
            Cells(5, 1) = " gauravShrestha "
            Cells(5, 2) = gauravShrestha
            Cells(13, 1) = " Prabin "
            Cells(13, 2) = Prabin
            Cells(14, 1) = " AnkuKumar "
            Cells(14, 2) = AnkuKumar
            Cells(15, 1) = " okendri"
            Cells(15, 2) = okendri
            Cells(16, 1) = " ONkarSUbba"
            Cells(16, 2) = ONkarSUbba
            Cells(17, 1) = " abhijeetSingh"
            Cells(17, 2) = abhijeetSingh
            Cells(18, 1) = " ashishSubba "
            Cells(18, 2) = ashishSubba
            Cells(19, 1) = " nitesh singh"
            Cells(19, 2) = nitishSIng
            Cells(1, 1) = " Manager Name "
            Cells(1, 2) = " Manager AieDee "
            Cells(2, 1) = " nishant kumar singh "
            Cells(2, 2) = nishant
            Cells(3, 1) = " Rohan Rai "
            Cells(3, 2) = Rohan
            Cells(4, 1) = "  AVIJIT DAS "
            Cells(4, 2) = das
            Cells(6, 1) = "Dipen Thapa"
            Cells(6, 2) = dipenThapa
            Cells(7, 1) = " Sibin Surendran "
            Cells(7, 2) = sibin
            Cells(8, 1) = "  Kushal Sahota "
            Cells(8, 2) = kushal
            Cells(9, 1) = "  SATYAM RAI "
            Cells(9, 2) = satyam
            Cells(10, 1) = "  Ashim Lama "
            Cells(10, 2) = ashimlama
            Cells(11, 1) = "  indrajeet kumar singh "
            Cells(11, 2) = inderjeet
            Cells(12, 1) = "   Vivek Lama "
            Cells(12, 2) = viveklama
    ElseIf ce = "F" Then
            Cells(1, 1) = " Manager Name "
            Cells(1, 2) = " Manager AieDee "
            Cells(2, 1) = " kalla panni "
            Cells(2, 2) = kp
            Cells(4, 1) = " MOmmY "
            Cells(4, 2) = mommy
            Cells(5, 1) = " madam "
            Cells(5, 2) = madam
            Cells(3, 1) = " daddy "
            Cells(3, 2) = daddy
            Range("A11").CurrentRegion.EntireColumn.AutoFit
    End If
    ss = ActiveSheet.Name
    Set sht = ThisWorkbook.Worksheets(ss)
    '''''Ctrl + Shift + End
      LastRow = Cells(sht.Rows.Count, 1).End(xlUp).Row
    gwH = InputBox("Want Game Week History (aa)")
    grpAvg = 0
    '  Cells(i, 4).Value = Time
       Cells(1, 3).Value = "Latest Score"
       'Cells(1, 6).Value = "Transfers"
       Cells(1, 5).Value = "add info " & Date
          
       Cells(1, 7).Value = "Overall points"
    '  Cells(1, 6).Value = "Overall points"
       Cells(1, 4).Value = Date
'Set ie = CreateObject("InternetExplorer.Application")
     Range("A3").CurrentRegion.EntireColumn.AutoFit
    gameweek = InputBox("Enter the Gameweek")
    Cells(1, 4).Value = "GW " & gameweek & " score"
    labor = 0
'ActiveSheet.Name = "GW " & gameweek & "  " & Time & "  " & Date
'++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++Newly addededededed____________0++++++++++++++++++++++++++++++++++++++++++++++++
    For i = decider To LastRow                                   '**************************************************-------------------------------Modified for debug mode
        ticker = Cells(i, 2).Value
        If gwH = "HH" Then
            GoTo TinDer
        End If
            'https://fantasy.premierleague.com/a/entry/3295162/history
            u = "https://fantasy.premierleague.com/entry/" & ticker & "/event/" & gameweek
            'https://fantasy.premierleague.com/entry/1530227/event/1
           ' u = "http://fantasy.premierleague.com/entry/" & ticker & "/event-history/" & gameweek & "/"
            ie.navigate u
            If Cells(1, 19) = "one" Then
                ie.Visible = 1
            End If
           
            ie.Top = 120
            ie.Left = 1020
            LocName = ie.LocationName
            LocURL = ie.LocationURL
                'statusbarText = ie.statusText
            'if i =2 then
            'ie.Visible = 1
            Application.Wait (Now + TimeValue("0:00:1"))
            Cells(i - 1, 2).Activate
            'ie.Visible = 1 '----------------------------------------------------------------------------------------------Visibility on
            'Application.Wait (Now + TimeValue("0:00:3"))
            'Application.Wait (Now + TimeValue("0:00:1"))
            'Cells(i - 1, 9).Activate
            Application.Wait (Now + TimeValue("0:00:1"))
            'Cells(i - 1, 23).Activate
            Application.Wait (Now + TimeValue("0:00:1"))
            ie.Visible = 0
            Cells(i - 1, 25).Activate
            'Application.Wait (Now + TimeValue("0:00:1"))
            ActiveSheet.Name = "FPL5_GW-" & gameweek & "-" & LastRow '& "" & Date'+
                Set doc = ie.document
            'labor = 0
            '       document.getElementsByClassName('subHeader ism-sub-header')[1].innerText
            'for name
RPK::
'ie.Visible = 1
             labor = labor + 1
             Cells(1, 17) = labor
             
                                        Application.Wait (Now + TimeValue("0:00:10"))
                                        'ActiveSheet.Name = "Feb" & " " & Doss
                                        If i = 2 Then
                                         Application.Wait (Now + TimeValue("0:00:10"))
                                        End If
                                        On Error Resume Next
                                                                                
                                       ' biju = doc.getElementsByClassName("subHeader ism-sub-header")(1).innerText
                                         
                                        'On Error GoTo 0
                                        
                                        
'                                        If biju = siju Then
'
'                                            If labor < (i * 10) Then
'
'                                               GoTo RPK
'                                            End If
'
'
'
'                                        End If
            
'            Shname = ie.document.getElementsByClassName("subHeader ism-sub-header")(1).innerText
'            Shname = Trim(Shname)
'            If Trim(Cells(i, 1)) = Shname Then
'                MsgBox " Matched"
'            End If
'
            'document.getElementsByClassName('subHeader ism-sub-header')[1].innerText
            
            'doc.querys
            'lst = ie.document.getElementsByClassName("event event-open")(oo).Children(3).Children(0).Children(hi).innerText
            'document.getElementsByClassName('ism-round-pager')[0].innerText
            
            
                'cGW = ie.document.getElementsByClassName("ism-round-pager")(0).innerText
            'cGW = Trim(cGW) ' GW can be extracted from two places URL and from DOM
            'ie.Visible = 1 '==================================================
            '       latest points - document.getElementsByClassName('EntryEvent__PrimaryValue-l17rqm-4 dKLPfQ')[0].innerText
            
            'LP = ie.document.getElementsByClassName("ism-scoreboard-points__primary")(0).Children(0).Children(1).innerText
             LP = ie.document.getElementsByClassName("EntryEvent__PrimaryValue-l17rqm-4 dKLPfQ")(0).innerText           '#new
            'document.getElementsByClassName("EntryEvent__PrimaryValue-l17rqm-4 dKLPfQ")[0].innerText
            'chips and wildwards
            '         current GW chip - document.getElementsByClassName('EntryEvent__ChipStatus-l17rqm-15 hFeyyJ')[0].innerText
            'Chips = ie.document.getElementsByClassName("ism-scoreboard-points__primary")(0).Children(1).innerText
            ChipsL = ie.document.getElementsByClassName("EntryEvent__ChipStatus-l17rqm-15 hFeyyJ").Length   '#new
            ' chipLength-document.getElementsByClassName('EntryEvent__ChipStatus-l17rqm-15 hFeyyJ').length
            '
           ' tra = ie.document.getElementsByClassName("ism-element__data")(3).innerText
            '        document.getElementsByClassName('ism-element__data')[3].innerText
            'Cells(20, 1) = Chips
            Cells(i, 6) = Time
            
            If ChipsL > 0 Then
                ' chips played
                Chips = ie.document.getElementsByClassName("EntryEvent__ChipStatus-l17rqm-15 hFeyyJ")(0).innerText           '#new
                Chips = Trim(Chips)
                Cells(i, 5) = Chips
            Else
                'no chip played
                Cells(i, 5) = "no chip played"
                
                          
            End If
            'document.getElementsByClassName('ism-data-list ism-data-list--bordered')[0].children[0].children[0].innerText
            

            gk = Split(LP, "R")
            dd = UBound(gk)
            LP = gk(0)
'''''            MsgBox gk(1)
'''''            MsgBox gk(2)
'''''            MsgBox gk(3)
            Cells(i, 3) = LP
            grpAvg = grpAvg + LP
            ich = i - 1
            
            AvgGrp = grpAvg / ich
            
            Cells(1, 13) = AvgGrp
            
            
            
            Cells(i, 3).Activate
            
            Cells(i, 1).Font.Color = RGB(20, 25, 5)
            
            
            
            
            '        document.getElementsByClassName('ism-scoreboard-points__secondary')[0].children[0].children[3].children[0].children[1].innerText
'            Xfr = ie.document.getElementsByClassName("ism-scoreboard-points__secondary")(0).Children(0).Children(3).Children(0).Children(1).innerText
'            If Cells(1, 6) = "Transfers Updated" Then
'               Cells(1, 66) = "Already updated"
'               'Without the below line it would hamper wen you run the leader's insest function it would take col'm 66
'
'               Cells(i, 66) = Xfr
'            Else
'               Cells(i, 6) = Xfr
'            End If
            
               
            '"0"
            'document.getElementsByClassName('ism-scoreboard-points__secondary')[0].children[0].children[3].children[0].children[0].innerText
            '"Transfers"
            'Current GW rank
            cGWr = ie.document.getElementsByClassName("EntryEvent__SecondaryValue-l17rqm-12 gBqbeC")(2).innerText    '#new
            'document.getElementsByClassName("EntryEvent__SecondaryValue-l17rqm-12 gBqbeC")[0].innerText
            Cells(i, 10) = cGWr
            
            AvgPts = ie.document.getElementsByClassName("EntryEvent__SecondaryValue-l17rqm-12 gBqbeC")(0).innerText
            HghPts = ie.document.getElementsByClassName("EntryEvent__SecondaryValue-l17rqm-12 gBqbeC")(1).innerText
            '          document.getElementsByClassName('ism-data-list ism-data-list--bordered')[0].children[3].children[1].innerText
            'GWpts = ie.document.getElementsByClassName("ism-data-list ism-data-list--bordered")(0).Children(3).Children(1).innerText
            '          document.getElementsByClassName('ism-data-list ism-data-list--bordered')[0].children[1].children[1].innerText
            Cells(1, 9) = "OVeraLL RanK"
            Cells(1, 10) = "GW A.P= " & AvgPts & " H.P= " & HghPts
            
            OvRrk = ie.document.getElementsByClassName("Entry__DataListValue-sc-1kf863-3 cmkvzv")(1).innerText
            'document.getElementsByClassName("Entry__DataListValue-sc-1kf863-3 cmkvzv")[1].innerText
            Cells(i, 9) = OvRrk
            gWpt = ie.document.getElementsByClassName("Entry__DataListValue-sc-1kf863-3 cmkvzv")(3).innerText
            Cells(i, 4) = gWpt
            'tot_xfr = ie.document.getElementsByClassName("ism-data-list")(1).Children(1).Children(1).innerText
                        'document.getElementsByClassName('ism-data-list')[1].children[1].children[1].innerText
'            nxt_Gwk_Xfr = ie.document.getElementsByClassName("ism-data-list")(1).Children(0).Children(1).innerText
'            tot_team_value = ie.document.getElementsByClassName("ism-data-list")(2).Children(0).Children(1).innerText
'            in_d_bank = ie.document.getElementsByClassName("ism-data-list")(2).Children(1).Children(1).innerText
            
            'Overall Rank
'            GWpts = Trim(GWpts)
'            Cells(i, 4) = GWpts
'            'ovr txt  document.getElementsByClassName('ism-data-list ism-data-list--bordered')[0].children[0].children[0].innerText
'            Opts = ie.document.getElementsByClassName("ism-data-list ism-data-list--bordered")(0).Children(0).Children(1).innerText
'            Cells(i, 7) = Opts
             'cup (i)
            'Range("I3").CurrentRegion.EntireColumn.AutoFit
            Dim cupEntrz As Integer
            'cupEntrz = ie.document.getElementsByClassName("ism-table--cup-sum__event").Length
            
'            If cupEntrz > 0 Then
'                CCupp = "Qualified"
'                Cup_Score = ie.document.getElementsByClassName("ism-table--cup-sum__score")(0).innerText
'                Opp_Name = ie.document.getElementsByClassName("ism-table--cup-sum__opponent")(0).innerText
'                Opp_Href = ie.document.getElementsByClassName("ism-table--cup-sum__opponent")(0).Children(0).href
'                Opp_wk = ie.document.getElementsByClassName("ism-table--cup-sum__event")(0).innerText
'                CCupp = Opp_wk + " " + Cup_Score + " " + Opp_Name
'
'               Cells(i, 17) = CCupp
'            Else
'               Cells(i, 17) = "Not Qualified"
'
'
'            End If

            GoTo TinDer '''''------------------------------------------------*including players stuff*-----------------------------------
            
                Dim psxl As Integer
                Dim pben As Integer
                psxl = 0
                pben = 0
                pun = 20
                'document.getElementsByClassName('subHeader ism-sub-header').length
                'autos is someting related to headers.
                
'                autos = ie.document.getElementsByClassName("subHeader ism-sub-header").Length
'
'                If autos = 2 Then
'
'                    Shname = ie.document.getElementsByClassName("subHeader ism-sub-header")(1).innerText
'                    Shname = Trim(Shname)
'                    Cells(i, 19) = Shname
'                ElseIf autos = 3 Then
'                    Shname = ie.document.getElementsByClassName("subHeader ism-sub-header")(2).innerText
'                    Shname = Trim(Shname)
'                    Cells(i, 19) = Shname
'                End If
                
                For ply = 0 To 14

                        mut = pun + ply
                        Cells(1, mut) = (ply + 1)
                        If ply > 10 Then
                            Cells(1, mut).Activate
                            Cells(1, mut).Interior.Color = RGB(233, 253, 253)
                            
                        End If
        
                        Cells(i, mut).Activate
                        Cells(i, mut).Font.Bold = False
                        Cells(i, mut).Font.Italic = False
                        'Application.Wait (Now + TimeValue("0:00:1"))
        
                        'For player name
                        'this piece of code is written to get the points scored by bench and starting XL wihtout going to GW history page.
        
                        '         document.getElementsByClassName('ism-element')[3].children[0].children[1].children[0].innerText
                        'For player match outcome
                        'ply = 6
                             'plnm = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(1).Children(0).innerText
                             '          document.getElementsByClassName('ism-element')[5].children[0].children[0].children[1].children[0].innerText
                             xplnm = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(0).Children(1).Children(0).innerText
                             plnm = xplnm
                             'MsgBox plnm
                            'for VC and Cs
                            'document.getElementsByClassName('ism-element__controls')[0].children.length
                            tooltip = ie.document.getElementsByClassName("ism-element__controls")(ply).Children.Length
                            If tooltip > 1 Then 'pakka bhai captain ya VC hai
                                'document.getElementsByClassName('ism-element__controls')[10].children[1].children[0].title
                                bahalue = ie.document.getElementsByClassName("ism-element__controls")(ply).Children(1).Children(0).Title
                                If bahalue = "Captain" Then
                                    'somthing
                                    Cells(i, mut).Font.Bold = True
                                Else
                                    'ply _____ VC
                                    MiamiVice = plnm
                                    Cells(i, mut).Font.Italic = True
                                    
                                    
                                    
                                
                                End If
                                
                                
                            
                            
                            End If
                            
                             
                        'document.getElementsByClassName('ism-element')[3].children[0].children[1].children[1].innerText
                        xplot = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(0).Children(1).Children(1).innerText
                        plot = Trim(xplot)
                        
                        'plot = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(1).Children(1).innerText
                        'new plot document.getElementsByClassName('ism-element')[4].children[0].children[0].children[1].children[1].innerText
                        cesare = Len(plot)
                        If cesare > 3 Then
                            plot = 0
                        ElseIf IsNumeric(plot) Then
                            'FOr playing players
                            'something should be present on plot
                            'my initial observation is two on error goto dosen't work simulatneously so trying to remove the plot on error statemnent and try the result
                            
                        Else
                                plot = 0
                            
                        End If
                        'Cells(1, 17) = "nxt_Gwk_Xfr"
                        'Cells(i, 17) = nxt_Gwk_Xfr
        
        
        
                        'Cells(i, j).Interior.Color <> RGB(255, 255, 255)
                        Cells(i, mut).Interior.Color = RGB(255, 255, 255) 'This will make sure dat each time cells starts on white , mainly helpful during the cleansheets lost wen goal is scored afr 60mins
                        
                        If ply < 11 Then
                            psxl = psxl + plot
                            If plot > 4 Then
                                Cells(i, mut).Interior.Color = RGB(205, 100, 51)
                                If plot > 8 Then
                                    Cells(i, mut).Interior.Color = RGB(192, 192, 192)
                                    If plot > 12 Then
                                        Cells(i, mut).Interior.Color = RGB(255, 215, 5)
                                    End If
                                End If
        
        
        
        
                            End If
        
                        Else
                            
                            
                            
                            'On Error Resume Next
                            
                            pben = pben + plot
                            'On Error GoTo 0
                            If plot > 4 Then
                                Cells(i, mut).Interior.Color = RGB(0, 255, 122)
                                If plot > 8 Then
                                    Cells(i, mut).Interior.Color = RGB(80, 255, 122)
                                    If plot > 12 Then
                                        Cells(i, mut).Interior.Color = RGB(160, 255, 122)
                                    End If
                                End If
        
                            End If
                        End If
                        'xplot = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(0).Children(1).Children(1).innerText
                        'plot = ie.document.getElementsByClassName("ism-element")(ply).Children(0).Children(1).Children(1).innerText
                        plot = Trim(xplot)
        
                        Cells(i, mut) = plnm & " " & plot
                        
        
                       ' MsgBox plnm & vbCr & plot

                Next
            Cells(i, 35) = "SxL " & psxl
            Cells(i, 36) = "B.P " & pben
            'MsgBox psxl & vbCr & pben
            Range("AE6").CurrentRegion.EntireColumn.AutoFit
            Application.Wait (Now + TimeValue("0:00:3"))
            Cells(i, 20).Activate
            
            
TinDer::
    
            If gwH = "aa" Then '------------------------------------------------------------------------------------------------------------------------------------------------
                'ie.Visible = 1
                
                    'https://fantasy.premierleague.com/a/entry/3295162/history
                u = "http://fantasy.premierleague.com/a/entry/" & ticker & "/history"
                ie.navigate u
                ie.Visible = 0
                'document.getElementsByClassName('ism-table')[1].children[1].children.length
                Application.Wait (Now + TimeValue("0:00:10"))
                ie.Left = 100
                
                ships = ie.document.getElementsByClassName("ism-table")(1).Children(1).Children.Length
                'Value of ships is the number of Chips/wildcard played could range from 0-5
                
                If ships > 0 Then
'                    ChipStart = 40
                     ChipStart = 12
                    
                    'document.getElementsByClassName('ism-table')[1].children[1].children[0].children[1].innerText
                    For shipsn = 0 To ships - 1
                        cp = ChipStart + shipsn
                        
                        ChipName = ie.document.getElementsByClassName("ism-table")(1).Children(1).Children(shipsn).Children(1).innerText
                        ChipTime = ie.document.getElementsByClassName("ism-table")(1).Children(1).Children(shipsn).Children(0).innerText
                        ChipStatus = ie.document.getElementsByClassName("ism-table")(1).Children(1).Children(shipsn).Children(2).innerText
                        Range("L3").CurrentRegion.EntireColumn.AutoFit
                        ChipGwk = ie.document.getElementsByClassName("ism-table")(1).Children(1).Children(shipsn).Children(3).innerText
                        Cells(i, cp) = ChipName & "  " & ChipGwk
                        
                        'Cells(i, cp).Activate
                        'Cells(i, 12) = Cells(i, cp)
                    Next
                    
                    
                
                
                
                    Else
                        mrs = "No Chips played so far"
                        
                    
                    
                    End If
                    
                'MsgBox ships
                
                
                
                
            End If
            siju = biju
            
            
            
            'ie.Visible = 1 '=========================================================================Visible-------------------------
     'Cells(1, 6) = "Transfers"
     If g2 = "on" Then
        Stop
    End If
    
     
    Next
    'cardelini (LastRow) '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++FUNCTION CALL( Cardelini)++++++++++++++++++++++++++++++++++++++++++++++++++++++
    'linethrough LastRow, gameweek
    'to call the cupFUnction to strikeout eliminated playerss
icebucket::
'
    
'             ice = InputBox("For leadder Y/N  If u are fetching for non-current GW don't use Y")
'
'             If ice = "Y" Then
'                pod = 8
'                    'FOr Third row Calcualtoins
'                 For i = 2 To LastRow
'                    If Cells(i, pod).Interior.Color <> RGB(255, 255, 255) Then
'                        Cells(i, pod).Interior.Color = RGB(255, 255, 255)
'                    End If
'                 Next
'                Call leader(pod, LastRow) '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++FUNCTION CALL( leader)++++++++++++++++++++++++++++++++++++++++++++++++++++++
'
'             End If



End Sub

Sub drandgrop()



End Sub
Function cclear()

For k = 0 To 10

            Cells(k + 2, 1).Interior.Color = RGB(255, 255, 255)
            Cells(k + 2, 1).Font.Color = RGB(2, 5, 5)
            Application.Wait (Now + TimeValue("0:00:1"))

    Next
End Function


Function leader(ByVal rod As Integer, ByVal winklewoss As Integer)

twins = winklewoss


Call insest(twins) '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++FUNCTION CALL( insest)++++++++++++++++++++++++++++++++++++++++++++++++++++++

'


 Dim r(100) As Integer
  Dim a(100)
 For i = 0 To twins - 2
 temp = Cells(i + 2, rod).Value
 r(i) = Replace(temp, "pts", " ")
 r(i) = Trim(r(i))
 
 Next
  
 For i = 0 To twins - 2
 
     For j = 0 To twins - 3
        
        If r(j + 1) > r(j) Then
         t = r(j)
         r(j) = r(j + 1)
         r(j + 1) = t
         
        End If
        
     
                     Next
       Next
   'Application.Wait (Now + TimeValue("0:00:2"))
   For ii = 0 To twins - 2
       'aaa = r(ii) & "pts"
        aaa = r(ii)
        a(ii) = aaa
   
   Next
   
   
   highest = a(0)
   secHigh = a(1)
   ThrHigh = a(2)
   FourthHigh = a(3)
   FifthHigh = a(4)
   SixthHigh = a(5)
   SeventhHigh = a(6)
   eighthHigh = a(7)
   ninethHigh = a(8)
   TenthHigh = a(9)
   EleventhHigh = a(10)
   
   
   
   
  'MsgBox a(0)
  
   For k = 0 To twins - 2
          Cells(k + 2, rod).Interior.Color = RGB(255, 255, 255)
          Cells(k + 2, rod).Activate
        
          If Cells(k + 2, rod).Value = highest Then
          
           Cells(k + 2, rod).Font.Color = RGB(0, 0, 0)
           Cells(k + 2, rod).Interior.Color = RGB(255, 215, 5)
           Application.Wait (Now + TimeValue("0:00:1"))
          
          ElseIf Cells(k + 2, rod).Value = secHigh Then
          
           Cells(k + 2, rod).Font.Color = RGB(0, 0, 0)
           Cells(k + 2, rod).Interior.Color = RGB(192, 192, 192)
            Application.Wait (Now + TimeValue("0:00:1"))
          ElseIf Cells(k + 2, rod).Value = ThrHigh Then
          
           Cells(k + 2, rod).Font.Color = RGB(0, 0, 0)
           Cells(k + 2, rod).Interior.Color = RGB(205, 100, 51)
           Application.Wait (Now + TimeValue("0:00:1"))
         ElseIf Cells(k + 2, rod).Value = FourthHigh Then
          
           Cells(k + 2, rod).Font.Color = RGB(0, 0, 0)
           Cells(k + 2, rod).Interior.Color = RGB(159, 100, 51)
           Application.Wait (Now + TimeValue("0:00:1"))
         ElseIf Cells(k + 2, rod).Value = FifthHigh Then
          
           Cells(k + 2, rod).Font.Color = RGB(0, 0, 0)
           Cells(k + 2, rod).Interior.Color = RGB(139, 100, 51)
           Application.Wait (Now + TimeValue("0:00:1"))
           
          End If
          
          
    Next
   
Cells(2, 3).Activate
Application.Wait (Now + TimeValue("0:00:4"))

End Function



Function insest(ByVal DV As Integer)

Cells(1, 8) = "Effective overall"
Range("A3").CurrentRegion.EntireColumn.AutoFit
For i = 2 To DV

        'Application.Wait (Now + TimeValue("0:00:1"))
        
        txfr = Cells(i, 66).Value
        txfr = Trim(txfr)
        'Cells(i, 66).Activate
                
        rr = InStr(1, txfr, "-")
        '6 (-4pts)
        rft = 0
        '6 (-20pts)
        
        If rr > 1 Then
                  tt = Right(txfr, 6)
                  ft = Left(tt, 1)
                      If ft = "-" Then
                          rft = Replace(tt, "pts)", "")
                          rft = Trim(rft)
                          rft = Right(rft, 1)
                         'Applicable for more than one digit deduction
                       Else
                          rft = Left(tt, 2)
                          'Applicable for one digit deduction
                          
                      End If
                  
        
        
          End If
        
          w = Cells(i, 3)
          pw = Cells(i, 4)
          rw = Replace(w, "pts", " ")
          rw = Trim(rw)
          rpw = Replace(pw, "pts", " ")
          rpw = Trim(rpw)
          devia = 0
          ow = Cells(i, 7)
          devia = (w - pw) 'add r and try
'          LFD = devia + ow
          LFD = devia + ow ' overall effective before transfer deductions
          
        
        
'          If w <> pw Then
'              Cells(i, 1).Activate
'
'              Cells(i, 1).Font.Color = RGB(255, 65, 0)
'             ' LFD=
'
'        '            Cells(i, 8) = LFD
'
'
'
'
'          End If
        '
        '    For i = 2 To 12
        '
        '        w = Cells(i, 3)
        '        pw = Cells(i, 4)
        '        rw = Replace(w, "pts", " ")
        '        rw = Trim(rw)
        '        rpw = Replace(pw, "pts", " ")
        '        rpw = Trim(rpw)
        '
        '
        '        If w <> pw Then
        '
        '            Cells(i, 1).Font.Color = RGB(255, 65, 0)
        '           ' LFD=
        '           ow = Cells(i, 7)
        '            devia = (w - pw)
        '            LFD = devia + ow
        ''            Cells(i, 8) = LFD
        '
        '
        '
        '
        '        End If
        cc = LFD
        cc = Replace(cc, "pts", " ")
        cc = Trim(cc)
        
        If (Trim(Cells(i, 3).Value) = 0) Then
        
            fccc = (cc - rft) 'overall effective after transfer deductions
        Else
            fccc = cc
        End If
        
        eff = rw - rft
        Cells(i, 67) = eff ' this logic works here if the initial point is zero.
        
        
        'fcc = (fccc & "pts")
        fcc = fccc
        ry = Cells(i, 3).Value
        
        Cells(i, 3).Value = ry & "(" & eff & ")"
        Cells(i, 8) = fccc
        
        
        Application.Wait (Now + TimeValue("0:00:1"))
  
      Next
  


End Function

Function cardelini(ByVal LR As Integer)


cou = 0
sXL = 0
bench = 0

For i = 1 To LR
    For j = 18 To 60
    
        If Cells(i, j).Interior.Color <> RGB(255, 255, 255) Then
            cou = cou + 1
            If j < 31 Then
                sXL = sXL + 1
            Else
                bench = bench + 1
            End If
            
            
            Cells(i, 18) = cou
            
            'MsgBox "something is not rite here"
            
            'GoTo somewhere
        End If
        
        
        'Cells(i, j).Interior.Color = RGB(255, 155, 242)
        'Cells(i, j).Color = RGB(33, 21, 222)
        
    Next
somewhere::
    Cells(1, 18) = "Count  "
    Cells(i, 18) = cou & "( " & sXL & "+" & bench & " )"
    
    cou = 0
    sXL = 0
    bench = 0
    
    Application.Wait (Now + TimeValue("0:00:1"))
Next
End Function

Sub secondSons()

    leader 8, 12

'insest 12

End Sub

Sub cup(ByVal i As Integer)
    Dim cupEntrz As Integer
    Set ie = CreateObject("InternetExplorer.Application")
    phogat = Split(underURnose, "/")
    ddd = UBound(phogat)
     Cells(k, 2) = phogat(5)
    cupEntrz = ie.document.getElementsByClassName("ism-table--cup-sum__event").Length
    
    If cupEntrz > 0 Then
       Cells(i, 18) = "Qualified"
    Else
        Cells(i, 18) = "Not Qualified"

End If




End Sub

Sub linethrough(ByVal LR As Integer, ByVal cGW As Integer)

neutralize (LR)
'LR = 23
'cGW = "18"
For i = 2 To LR
    
    vvd = Cells(i, 17).Value
    phogat = Split(vvd, " ")
    ddd = UBound(phogat)
    GW = phogat(0)
    tt = Right(GW, 2)
    If cGW = tt Then
         Cells(i, 17).Font.Underline = xlUnderlineStyleSingle
    Else
        Cells(i, 17).Font.Strikethrough = True
         
        
    End If
Next


End Sub

Sub neutralize(ByVal LR As Integer)
    For i = 2 To LR
        Cells(i, 17).Font.Underline = False
        Cells(i, 17).Font.Strikethrough = False
    Next
End Sub






Attribute VB_Name = "FPLscrapperLeagues"
Sub PlyrHistAndFix()

Set ie = CreateObject("InternetExplorer.Application")

Dim kay As Integer
'GoTo hell ' hell is for Transfers page

ie.navigate "https://fantasy.premierleague.com/a/statistics/cost_change_start"
feb = "https://fantasy.premierleague.com/a/leagues/standings/313/classic?phase=8&lsPage=1&lePage=1"
jan = "https://fantasy.premierleague.com/a/leagues/standings/313/classic?phase=7"
ovrall = "https://fantasy.premierleague.com/a/leagues/standings/313/classic"
india = "https://fantasy.premierleague.com/a/leagues/standings/120/classic" 'https://fantasy.premierleague.com/leagues/120/standings/c
gerMany = "https://fantasy.premierleague.com/leagues/100/standings/c"
Dim Last_Page As Integer
Last_Page = 2

ie.navigate ovrall
ie.navigate india
ie.Visible = 1
 Application.Wait (Now + TimeValue("0:00:10"))
   'ovr
   'https://fantasy.premierleague.com/a/leagues/standings/313/classic
'            Do
'            DoEvents
'            Loop Until ie.ReadyState = 4
       ie.Left = 2

            'Set doc = ie.document
            'document.getElementsByClassName('ism-table')[10].children[1].children[k].children[i].innerText
            'document.getElementsByClassName('ism-table')[10].children[1].children.length
            'document.getElementsByClassName('ism-eiw-properties__body__primary')[0].children[0].innerText
           
   
   'Stop
   GoTo hell '===========================================For FPL Ranking data Extracter
   
   '#257d5a for 1-    37, 125, 90
   '#00ff86 for 2-0, 255, 134
   '#ebebe4 for 3-    235, 235, 228
   '#ff005a for 4-255, 0, 90
   '#861d46 for 5-RGB Decimal 134, 29, 70
hell::
'Stop

'GoTo Shamiyana'=====================================================COmment it if you FPL ranking extraccing ..it will go to saving sheet


                    'document.getElementsByClassName('ism-table ism-table--standings')[0].children[1].children.length
                    
            'lend = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children.Length
            k = 2
            labor = 0
            
            '                document.getElementsByClassName('ism-table ism-table--standings')[0].children[1].children[1].children[1].children[0].href
            'above one is for HREF content it needs to b split to get the manager AieDee
                    For p = 1 To Last_Page
                                'For ai = 0 To lend - 1
                                'Application.Wait (Now + TimeValue("0:00:1"))
RPK::
                                labor = labor + 1
                                Cells(1, 1) = labor
                                        Application.Wait (Now + TimeValue("0:00:1"))
                                        'ActiveSheet.Name = "Feb" & " " & Doss
                                        
                                        biju = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(0).Children(1).Children(0).href
                                        
                                        
                                        
                                        If biju = siju Then
                                        
                                            If labor < (p * 10) Then
                                            
                                               GoTo RPK
                                            End If
                                        
                                        
                                        
                                        End If
                                
                                
                                'biju = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(0).Children(1).Children(0).href
        
                                
                                        For ai = 0 To 49
                                            'for the rank    document.getElementsByClassName('ism-table ism-table--standings')[0].children[1].children[2].children[0].innerText
                                                     Rank = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(ai).Children(0).innerText
                                            Rank = Trim(Rank)
                                            Cells(k, 8) = Rank
                                            underURnose = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(ai).Children(1).Children(0).href
                                            phogat = Split(underURnose, "/")
                                            
                                            ddd = UBound(phogat)
                                            Cells(k, 2) = phogat(5)
                                            'MsgBox phogat(5)
                                            'for the Name    document.getElementsByClassName('ism-table ism-table--standings')[0].children[1].children[2].children[1].innerText
                                                     st = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(ai).Children(1).innerText
                                                    gk = Split(st, vbCrLf)
                                                    dd = UBound(gk)
                                                    'MsgBox gk(0)
                                            On Error Resume Next
                                            
                                            Cells(k, 1) = gk(1)
                                            Cells(k, 3) = gk(0)
                                            On Error GoTo 0
                                            
                                            
                                            'Gw pts   document.getElementsByClassName('ism-table ism-table--standings')[0].children[1].children[10].children[2].innerText
                            
                                             GWpts = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(ai).Children(2).innerText
                                            OvRpts = ie.document.getElementsByClassName("ism-table ism-table--standings")(0).Children(1).Children(ai).Children(3).innerText
                                            Cells(k, 4) = GWpts
                                            Cells(k, 5) = OvRpts
                                            Cells(k, 5).Activate
                                           ' k = ai + 2
                                            k = k + 1
                                            Range("A2").CurrentRegion.EntireColumn.AutoFit
                                           
                                
                                                    '                    k = k + 1
                                                    '                Cells(1, 1).Value = k
                                        '"https://fantasy.premierleague.com/a/team/1746667"
                                            Next
                        'document.getElementsByClassName('ismjs-link btn ism-button ism-button--full ism-pager__button--next')[0].click()
                        ie.document.getElementsByClassName("ismjs-link btn ism-button ism-button--full ism-pager__button--next")(0).Click
                        Application.Wait (Now + TimeValue("0:00:5"))
                        siju = biju
                        
                    Next
Shamiyana:
            Shname = "Top " & k & " " & NameGenerator
            ActiveSheet.Name = Shname
            
            'ie.navigate underURnose
            

End Sub

Sub fool()
'
''MsgBox Time
''s = Replace(Time, ":", "_")
''MsgBox s
'ss = Date & " " & s

t = NameGenerator

Shname = "top" & "num" & t
            ActiveSheet.Name = Shname

End Sub
Function NameGenerator() As String



s = Replace(Time, ":", "_")
'MsgBox s
ss = Date & " " & s


SN = ss
NameGenerator = SN



End Function


Sub something()

Dim rrrw As Integer
rrrw = 4
'colorFooled rrrw
Stop
End Sub
Function colorFooled(rrow As Integer)

cf = Trim(Cells(rrow, 4))
'#257d5a for 1-    37, 125, 90
   '#00ff86 for 2-0, 255, 134
   '#ebebe4 for 3-    235, 235, 228
   '#ff005a for 4-255, 0, 90
   '#861d46 for 5-RGB Decimal 134, 29, 70

Select Case cf
                Case "1"
                    Cells(rrow, 4).Interior.Color = RGB(37, 125, 90)
                    
                Case "2"
                    Cells(rrow, 4).Interior.Color = RGB(0, 255, 134)
                Case "3"
                    Cells(rrow, 4).Interior.Color = RGB(235, 235, 228)
                Case "4"
                    Cells(rrow, 4).Interior.Color = RGB(255, 0, 90)
                Case "5"
                    Cells(rrow, 4).Interior.Color = RGB(134, 29, 70)
             End Select
             



End Function



Attribute VB_Name = "playersCount_v2"
Sub playerCountAnalysis()

    Cells(30, 18).Value = "PLAYERS"
    ss = ActiveSheet.Name
    Set sht = ThisWorkbook.Worksheets(ss)
    LastRow18 = Cells(sht.Rows.Count, 18).End(xlUp).Row
     Cells(30, 19).Value = "PLAYERS_COUNT"
     Cells(30, 20).Value = "CAPTAIN_COUNT"
     Cells(30, 21).Value = "CAPTAINED_MGR"
     
    For r = 2 To 29 ' for all the rows of each manager
        For c = 20 To 34    ' for all the players of each row
            a = Cells(r, c).Value  ' getting each player
            'De Bruyne 2 is an exception
            emi = Split(a, "De Bruyne")
            temp = UBound(emi)
            If UBound(emi) > 0 Then
                 a = "De Bruyne"
            Else
                deedee = Split(a, " ")
                a = deedee(0)
            End If
            
            For t = 30 To LastRow18 ' comparing with already present player
                comparedValue = Cells(t, 18).Value  'first comparing with the header too
                mart = Split(comparedValue, "De Bruyne")
                If UBound(mart) > 0 Then
                    comparedValue = "De Bruyne"
                Else
                    deedee = Split(comparedValue, " ")
                    comparedValue = deedee(0)
                End If
                
                If comparedValue = a Then ' if  present incrementing
                    If Cells(t, 19).Value = "" Then 'seems redundant
                        Cells(t, 19).Value = 0
                    End If
                    
                    inc = Cells(t, 19).Value
                    Cells(t, 19).Value = inc + 1
                    present = "Y"
                    cap = Cells(r, c).Value
                    tain = Split(cap, "$")
                    If UBound(tain) > 0 Then
                        Capt_flag = 1
                        If Cells(t, 20).Value = "" Then 'when nothing is there in right row
                            Cells(t, 20).Value = 0
                        End If
                        Cinc = Cells(t, 20).Value
                        Cells(t, 20).Value = Cinc + 1
                        If Cells(t, 21).Value = "" Then 'for captained manager first time
                            r18 = Cells(r, 18)
                            Cells(t, 21).Value = r18
                        Else
                            alD = Cells(t, 21).Value
                            r18 = Cells(r, 18)
                            Cells(t, 21).Value = alD + " , " + r18
                        End If
                    End If
                    GoTo skipperOfLoop
                Else ' if not present create an entry
                present = "N"
                End If
            Next
skipperOfLoop::
            If present = "N" Then
                Cells(LastRow18 + 1, 18).Value = a 'create an entry in the lastRow plus one
                Cells(LastRow18 + 1, 19).Value = 1 ' increment with one as the player is first timer
                LastRow18 = Cells(sht.Rows.Count, 18).End(xlUp).Row ' now update the new lastRow18 value
                cap = Cells(r, c).Value
                tain = Split(cap, "$")
                If UBound(tain) > 0 Then ' Adding captains entrz if firstTime encountred
                    Capt_flag = 1
                    If Cells(t, 20).Value = "" Then 'when nothing is there in right row
                        Cells(t, 20).Value = 0
                    End If
                    Cinc = Cells(t, 20).Value
                    Cells(t, 20).Value = Cinc + 1
                    If Cells(t, 21).Value = "" Then 'for captained manager first time
                            r18 = Cells(r, 18)
                            Cells(t, 21).Value = r18
                        Else
                            alD = Cells(t, 21).Value
                            r18 = Cells(r, 18)
                            Cells(t, 21).Value = alD + " , " + r18
                        End If
                End If
            End If
        Next
        
    Next
    fixx LastRow18
    
    
End Sub

Sub aller()
LastRow = 29

CaptainVIce (LastRow)
'CaptainRemoval (LastRow)
'Function leader(ByVal rod As Integer, ByVal winklewoss As Integer)
End Sub

Sub fixx(ByVal LastRow18 As Integer)

 'LastRow18 = 147
 For t = 30 To LastRow18
    a = Cells(t, 20).Value
    If Cells(t, 20).Value = "" Then 'when nothing is there in right row
       Cells(t, 20).Value = 0
       
    Else
        Cells(t, 20).Font.Bold = True
    End If
    
 
 Next
 

End Sub


Sub CaptainVIce(ByVal rrow As Integer)
    
    For r = 2 To rrow ' for all the rows of each manager
        For c = 20 To 34    ' for all the players of each row
           If Cells(r, c).Font.Bold = True Then
                skp = Cells(r, c).Value
                Cells(r, c).Value = skp + "$ captain"
           End If
           
        Next
    Next


End Sub

Sub CaptainRemoval(ByVal rrow As Integer)

    For r = 2 To rrow ' for all the rows of each manager
        For c = 20 To 34
            currentPlayer = Cells(r, c).Value ' for all the players of each row
           If Cells(r, c).Font.Bold = True Then
                skp = Cells(r, c).Value
                mart = Split(skp, "$")
                Cells(r, c).Value = mart(0)
           End If
           
        Next
    Next



End Sub

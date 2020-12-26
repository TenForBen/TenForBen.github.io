Attribute VB_Name = "GwkTransfersV2"
        
Sub GameweekTransfers()
' I am totallhy pissed at myself because wen u had time and energy to get all 4 detaills of the row then y did u only go for Xfr in
' Should have just gone for the entire row detail.. nw m sitting here understanding the code again and trying to get d rest of the three fiels

Set ie = CreateObject("InternetExplorer.Application")

Dim rai(100) As String
Dim pai(100) As String
Dim sai(100) As Date
Dim bai(100) As String
r = 0
pp = 0
ppp = 0
patodia = 0
gameweek = InputBox("Enger the Gameweek")
coutinho = "GW" & gameweek

On Error GoTo np 'First error handling in the history of boxing


ss = ActiveSheet.Name

Set sht = ThisWorkbook.Worksheets(ss)

'''''Ctrl + Shift + End
LastRow = Cells(sht.Rows.Count, 1).End(xlUp).Row
sujan = 0
mos = 0
'document.getElementsByClassName('ism-table').length
'mos = ie.document.getElementsByClassName("ism-table").Length


    For ii = 2 To LastRow
            
            ticker = Cells(ii, 2).Value
            'u = "http://fantasy.premierleague.com/a/team/" & ticker & "/event/" & gameweek
            '            https://fantasy.premierleague.com/entry/1530227/transfers
            ie.navigate "https://fantasy.premierleague.com/entry/" & ticker & "/transfers"
            ie.Visible = 0
            ie.Visible = 1 '''''*************************************************************************************TO change here wen debugging is over
            
np::
            patodia = patodia + 1
            
'            If patodia > 100 Then
'                Exit Sub
'            End If
            
            
                
            Application.Wait (Now + TimeValue("0:00:2"))
            Application.Wait (Now + TimeValue("0:00:12"))
            sujan = sujan + 1
            
            mos = ie.document.getElementsByClassName("ism-table").Length
            
            'If mos = 0 Then GoTo np
            
'
'            Do
'            DoEvents
'            Loop Until ie.ReadyState = 4
            
            Set doc = ie.document
            'document.getElementsByClassName('ism-table')[10].children[1].children[k].children[i].innerText
            'document.getElementsByClassName('Layout__Main-eg6k6r-1 haICgV')[0].children[1].children[0].children[1].children.length
            lend = ie.document.getElementsByClassName("Layout__Main-eg6k6r-1 haICgV")(0).Children(1).Children(0).Children(1).Children.Length
            col = 40
            kay = 1
            For k = 0 To lend - 1
                        '  document.getElementsByClassName('ism-table')[0].children[1].children[2].children[3].innerText
                            'document.getElementsByClassName('Layout__Main-eg6k6r-1 haICgV')[0].children[1].children[0].children[1].children[0].children[3].innerText
                    's = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(3).innerText
                    s = ie.document.getElementsByClassName("Layout__Main-eg6k6r-1 haICgV")(0).Children(1).Children(0).Children(1).Children(k).Children(3).innerText
                    
                    aass = Trim(s)
                     'for the column to fetch the transfer details
                    If aass = coutinho Then
                        lgw = 1 ' To Make Sure that we have last/desired game week
                        
                        For e = 0 To 3
                                'Uri = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(e).innerText
                                Uri = ie.document.getElementsByClassName("Layout__Main-eg6k6r-1 haICgV")(0).Children(1).Children(0).Children(1).Children(k).Children(e).innerText
                                If e = 1 Then ' This one is exclusively for Xfr in player
                                    'ply = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(1).innerText
                                    ply = ie.document.getElementsByClassName("Layout__Main-eg6k6r-1 haICgV")(0).Children(1).Children(0).Children(1).Children(k).Children(1).innerText
                                    'plyout = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(2).innerText
                                    plyout = ie.document.getElementsByClassName("Layout__Main-eg6k6r-1 haICgV")(0).Children(1).Children(0).Children(1).Children(k).Children(2).innerText
            '                        Cells(5, col) = Uri
            '
            '                        col = col + 1
                                    rai(r) = ply
                                    bai(r) = ply & " / " & plyout
                                    
                                    r = r + 1
                                    
                                    
                                End If
                                
'
'                                If e = 2 Then ' This one is exclusively for Xfr out player
'                                    ply = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(2).innerText
'
'            '                        Cells(5, col) = Uri
'            '
'            '                        col = col + 1
'                                    pai(pp) = ply
'                                    pp = pp + 1
'
'
'                                End If
'
'                                 If e = 0 Then ' This one is exclusively for Xfr TimeStamp player
'                                    ply = ie.document.getElementsByClassName("ism-table")(0).Children(1).Children(k).Children(0).innerText
'
'            '                        Cells(5, col) = Uri
'            '
'            '                        col = col + 1
'                                    sai(ppp) = ply
'                                    ppp = ppp + 1
'
'
'                                End If
                                'MsgBox Uri
                        Next
                        
                        
                        
                    End If
                    akri = r - 1

            Next
            For iii = 0 To akri
                
                    Cells(ii, col) = rai(iii)
                    Cells(ii, col) = bai(iii)
                    Cells(ii, col).Activate
                    Application.Wait (Now + TimeValue("0:00:1"))
                    col = col + 1
                    
                
            Next
            temp = Cells(ii, 6)
            If akri = -1 Then
                Cells(ii, 6) = temp
            ElseIf akri = 0 Then
                Cells(ii, 6) = temp & " " & rai(0)
            ElseIf akri = 1 Then
                Cells(ii, 6) = temp & " " & rai(0) & "," & rai(1)
            ElseIf akri = 2 Then
                Cells(ii, 6) = temp & " " & rai(0) & "," & rai(1) & "," & rai(2)
            ElseIf akri = 3 Then
                Cells(ii, 6) = temp & " " & rai(0) & "," & rai(1) & "," & rai(2) & "," & rai(3)
            ElseIf akri = 4 Then
                Cells(ii, 6) = temp & " " & rai(0) & "," & rai(1) & "," & rai(2) & "," & rai(3) & "," & rai(4)
            ElseIf akri = 5 Then
                Cells(ii, 6) = temp & " " & rai(0) & "," & rai(1) & "," & rai(2) & "," & rai(3) & "," & rai(4) & "," & rai(5)
            Else
                Cells(ii, 6) = temp & " Wildcard OR C"
            End If
            Cells(ii, 6).Activate
             Range("f2").CurrentRegion.EntireColumn.AutoFit
            
                
            
            
                
            
                
                        
                
                
            r = 0
            
    Next
    Cells(1, 6) = "Transfers Updated"
End Sub


var radiobut;
var rnc;
var bts;
var urc;
var ip;                                                                                                       
var mac;
var cab;
var bootsrv;
var iparr=[];
var dhtarr=[];
var pntarr=[];
var macreg = "";
var macreg6 ="";

function validateForm(iparr) {
	var cab2 = "";
	var urc1 = "";
	var dht = "";
	var bngate = "";
	var bngate1 = "0";
	var pnt = "";
	var bnreg = "";

	radiobut = document.forms["dhcp"]["action"].value;
	bts = document.forms["dhcp"]["bts"].value;
	urc = document.forms["dhcp"]["urc"].value;
	mac = document.forms["dhcp"]["mac"].value;
	cab = document.forms["dhcp"]["cab"].value;

	if ( document.forms["dhcp"]["but"].value == "Proceed" ) {
		if (cab == "cab2" && urc == "urc3"){ cab2 = "_cab2"; }						// 9917 2nd cab
		if (urc == "urc1") {										// 9224 urc1+2 cab is always 1
			urc1 = ":ParentUrcId=1"
			cab = "cab1";	
		}
		var lr_arr = ["l","r"];                                 					// 4 dht+4 pnt commands (-A or -M) for 
		var cmdcnt = 0;											// cmdarr filling
		for (var i = 0; i < lr_arr.length; i++) {               					// lcell and rcell
			for ( var j=1; j<3; j++ ) {                     					// flx121/122
// DHT //       	
				bngate = parse_ip(iparr);
				if ( /\s*21\s*/.test(bngate[1]) && i==0 ) { bngate1 = "23"; }			// bngate + removing spases ...
				else if ( /\s*25\s*/.test(bngate[1]) && i==0 ) { bngate1 = "27"; }	
				else if ( /\s*21\s*/.test(bngate[1]) && i==1 ) { bngate1 = "24"; }
				else if ( /\s*25\s*/.test(bngate[1]) && i==1 ) { bngate1 = "28"; }		// ...
				if ( bnreg = /\s*(\d+)\s*/.exec(bngate[0]) ) { var bngate0 = bnreg[1]; }
				if ( bnreg = /\s*(\d+)\s*/.exec(bngate[2]) ) { var bngate2 = bnreg[1]; }
				if ( bnreg = /\s*(\d+)\s*/.exec(bngate[3]) ) { var bngate3 = bnreg[1]; } 	// ... from IP

				var bng = bngate0+"."+bngate1+"."+bngate2;
				var ethr = bng+"."+bngate3;
				
				dht = "dhtadm "+radiobut+" -m "+lr_arr[i]+"cell"+bts+cab2+" -d ':btsid="+bts+":bngate="+bng+".254:ethrIp=";
				dht = dht+ethr+":BootSrvA="+parse_rnc()+":bssaipaddr0="+parse_rnc()+":bssaipaddr1="+parse_rnc()+":bssaPortNum=7900:";
				dht = dht+"ParentCabType=4"+urc1+":bnmask=24:cnmask=26:'";			
// PNT //
				macreg = /(\w\w).*(\w\w).*(\w\w).*(\w\w).*(\w\w).*(\w\w)/.exec(mac);		// parse MAC w or wo ":"
				if ( j == 1 && i == 0 ) {
					mac = "01" + macreg[1] + macreg[2] + macreg[3] + macreg[4] + macreg[5] + macreg[6];
				}
				macreg6 = macreg[6];
				var mac0 = "01" + macreg[1] + macreg[2] + macreg[3] + macreg[4] + macreg[5];

// if urc1 && !9916 - increase MAC one time
				if ( urc1 && document.getElementById("9916").checked == false && i == 0 && j == 1 ) {
					mac = "0" + hex_increase();
				}

				mac = mac.toUpperCase();
				pnt = "pntadm "+radiobut+" "+ethr+" -i '"+mac+"' -m "+lr_arr[i]+"cell"+bts+cab2+" -s 172.17.1."+j;
				pnt = pnt+" -f 03 "+bng+".0";
// DEL //				
				if ( radiobut == "-D" ) {                                                                                                    
					dht = "dhtadm "+radiobut+" -m "+lr_arr[i]+"cell"+bts+cab2;
					pnt = "pntadm "+radiobut+" "+ethr + " " + bng + ".0";
				}
// CMD arr //		        
				dhtarr[cmdcnt] = dht;
				pntarr[cmdcnt] = pnt;
				cmdcnt++;

			} 
		}
		exec_cmd();
		print_params();
	}
}

function mac_disable() {
	document.forms["dhcp"]["mac"].setAttribute('disabled',"");
	document.forms["dhcp"]["urc"].setAttribute('disabled',"");
	document.forms["dhcp"]["rnc"].setAttribute('disabled',"");
}

function parse_ip(iparr) {
        ip = document.forms["dhcp"]["ip"].value;
	iparr = ip.split('.');
	return iparr;
}

function parse_rnc() {
	rnc = document.forms["dhcp"]["rnc"].value;
	var rnchash = {
		"1": "172.17.0.37",
		"2": "172.17.0.101",
		"3": "172.17.0.165",
		"4": "172.17.0.229",
		"7": "172.17.8.37",
		"8": "172.17.8.101",
		"9": "172.17.8.165",
		"10": "172.17.8.229",
		"12": "172.17.2.37",
		"13": "172.17.1.36"
	};
	bootsrv = rnchash[rnc];
	return bootsrv;
}

function exec_cmd() {
	document.body.textContent = "";
	
	document.body.innerHTML = document.body.innerHTML + "<br><b>telnet flx121</b><br>";
	document.body.innerHTML = document.body.innerHTML + dhtarr[0] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + pntarr[0] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + dhtarr[2] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + pntarr[2] + "<br><br>";

	document.body.innerHTML = document.body.innerHTML + "<b>/etc/init.d/dhcp stop</b><br><b>/etc/init.d/dhcp start</b><br>";
	document.body.innerHTML = document.body.innerHTML + "<br><b>telnet flx122</b><br>";

	document.body.innerHTML = document.body.innerHTML + dhtarr[1] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + pntarr[1] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + dhtarr[3] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + pntarr[3] + "<br><br>";
	document.body.innerHTML = document.body.innerHTML + "<b>/etc/init.d/dhcp stop</b><br><b>/etc/init.d/dhcp start</b><br><br>";

	var cmd = "telnet flx121\n" + dhtarr[0] + "\n" + pntarr[0] + "\n" + dhtarr[2] + "\n" + pntarr[2] + "\n/etc/init.d/dhcp stop\n/etc/init.d/dhcp start\n";
	cmd = cmd + "telnet flx122\n" + dhtarr[1] + "\n" + pntarr[1] + "\n" + dhtarr[3] + "\n" + pntarr[3]+ "\n";
	cmd = cmd + "/etc/init.d/dhcp stop\n/etc/init.d/dhcp start";
        document.write(
		document.body.innerHTML + '<a href="data:text/plain;charset=utf-8,%EF%BB%BF' + encodeURIComponent(cmd) + '" download="cmd.txt">Click to save file cmd.txt</a>'
	)
}

function print_params() {
	document.body.innerHTML = document.body.innerHTML + "<br><br>Action = <b>" + radiobut + "</b>";
	document.body.innerHTML = document.body.innerHTML + "<br><br>RNC = <b>" + rnc + "</b>";
	document.body.innerHTML = document.body.innerHTML + "&nbsp&nbspBTS = <b>" + bts + "</b>";
	document.body.innerHTML = document.body.innerHTML + "&nbsp&nbspURC = <b>" + urc + "</b>";
	document.body.innerHTML = document.body.innerHTML + "<br><br>IP = <b>" + ip + "</b>";
	document.body.innerHTML = document.body.innerHTML + "&nbsp&nbspMAC = <b>" + mac + "</b>";
	document.body.innerHTML = document.body.innerHTML + "&nbsp&nbspCAB = <b>" + cab + "</b>";
	document.body.style.backgroundColor = "grey";
}

function hex_increase() {
	var macnew = (parseInt(mac, 16) + 1).toString(16)				// ((hex2dec)+1).dec2hex
	return macnew;
}

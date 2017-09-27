$(function() {
    // Get altcoin ticker from coinmarketcap
    $.getJSON('https://api.coinmarketcap.com/v1/ticker/', function(data) {
        var names = [];
        var all = [];

        $.each(data, function(key, val) {
            names.push(val['name']);
            all.push([val['name'], val['price_usd'], val['price_btc'], val['symbol']]);
        });
        
        
        $('#crypto_chooser input').autocomplete({
            source: names,
            change: function( event) {
                var coin = $(this).val();
                if(coin === null || ($.inArray(coin, names) == -1))
                   $(this).val(''); /* clear the value */
                   $(this).attr('placeholder', 'Please choose a coin from the dropdown');
            }
        });
        
        
        $('#crypto_chooser input').on('focusout', function(e) {
            var crypto_name = $(this).val();
            var position = names.indexOf($(this).val());
            var btc_value = parseFloat(all[position][2]);
            var usd_value = parseFloat(all[position][1]);
            var eth_value = (parseFloat(all[position][2]) / all[names.indexOf('Ethereum')][2]).toFixed(5)

            $('#chosen_icon').removeClass().addClass('cc ' + all[position][3]);

            $('#btc_value').text(btc_value);
            $('#eth_value').text(eth_value);
            $('#usd_value').text('$' + usd_value);

        });
    });


    // Submit form data
    $('#crypto-alert-create').click(function() {
        // Ensure that a valid coin has been chosen
        if ($('#crypto_chooser input').val() === "") {
            $('#crypto_chooser input').focus();
            return;
        }
        if ($('#amount_chooser input').val() === "") {
            $('#amount_chooser input').focus();
            return;
        }
        
        if (!email_and_sms_validator()) {
            return;
        }
        
        var form_data = $('form').serializeArray()
        var coin_current_price = parseFloat($('#btc_value').text());
        var coin_alert_price = parseFloat($("[name='btc_alert_price']").val());

        // Add BTC current price to form data
        form_data.push({ 'name': 'btc_price_at_creation', 'value': coin_current_price })

        $.ajax({
            url: '/crypto_form_consumer',
            data: $.param(form_data),
            type: 'POST',
            success: function(response) {
                console.log(response);
            },
            error: function(error) {
                console.log(error);
            }
        });
        
        // Display last submitted alert info box
        $('#last_submit_message').slideDown().text(alert_message());

        // Reset all form fields
        document.getElementById('form').reset();
        $('.currency_conversion_foreground').text('');

        
    });
});

function coin_choice_validator(names){
    console.log('hello')
    var chosen_altcoin = $('#crypto_chooser input');
    if(chosen_altcoin === null || ($.inArray(chosen_altcoin.val(), names) == -1))
       chosen_altcoin.val(''); /* clear the value */
       chosen_altcoin.attr('placeholder', 'Please choose a coin from the dropdown');
}

// Creates an alert message underneath the tool after an alert is succesfully published
function alert_message() {
    var form_data = {}
    $('form').serializeArray().map(function(x) { form_data[x.name] = x.value; });
    form_data['btc_price_at_creation'] = parseFloat($('#btc_value').text())
    
    var delivery_methods = "";
    var direction = "";
    var message = "";

    
    if (form_data['email'] && form_data['sms']) {
        delivery_methods = "SMS and Email alerts";
    }
    else if (form_data['email']) {
        delivery_methods = 'an email alert to ' + form_data['email'];
    }
    else {
        delivery_methods = 'an SMS alert to ' + form_data['sms'];
    }

    if (parseFloat(form_data['btc_alert_price']) < parseFloat(form_data['btc_price_at_creation'])) {
        direction = "dropped below ";
    }
    else {
        direction = "risen above ";
    }

    message = 'New ' + form_data['crypto_chooser'] + ' alert created: You will receive ' +
        delivery_methods + ' when ' + form_data['crypto_chooser'] + ' has ' + direction +
        form_data['btc_alert_price'] + ' BTC';
    return message;
}

function email_and_sms_validator(email, sms) {
    var regex_email = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var regex_sms = /^\s*(?:\+?(\d{1,3}))?[- (]*(\d{3})[- )]*(\d{3})[- ]*(\d{4})(?: *[x/#]{1}(\d+))?\s*$/;
    
    var email = $("[name='email']").val();
    var sms = $("[name='sms']").val();
    
    var email_test = regex_email.test(email);
    var sms_test = regex_sms.test(sms)

    var currency = $('#crypto_chooser input').val();

    if (email_test && sms_test) {
        $('#crypto-alert-create').text('Create both SMS and EMAIL alerts for ' + currency)
        return true;
    }
    else if (email_test && !sms_test) {
        $('#crypto-alert-create').text('Create an EMAIL alert for ' + currency)
        return true;
    }
    else if (sms_test && !email_test) {
        $('#crypto-alert-create').text('Create an SMS alert for ' + currency)
        return true;
    }
    else {
        $('#crypto-alert-create').text('Please enter a delivery method to create an alert!')
        $("[name='email']").focus();
        return false;
    };
    
}
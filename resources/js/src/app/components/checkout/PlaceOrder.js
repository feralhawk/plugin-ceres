var ApiService = require("services/ApiService");
var NotificationService = require("services/NotificationService");

Vue.component("place-order", {

    props: [
        "targetContinue",
        "template"
    ],

    data()
    {
        return {
            waiting: false
        };
    },

    computed: Vuex.mapState({
        checkoutValidation: state => state.checkout.validation
    }),

    created()
    {
        this.$options.template = this.template;
    },

    methods: {

        preparePayment()
        {
            this.waiting = true;

            if (this.validateCheckout())
            {
                ApiService.post("/rest/io/checkout/payment")
                    .done(response =>
                    {
                        this.afterPreparePayment(response);
                    })
                    .fail(error =>
                    {
                        this.waiting = false;
                    });
            }
            else
            {
                NotificationService.error(Translations.Template.generalCheckEntries);
                this.waiting = false;
            }
        },

        validateCheckout()
        {
            let isValid = true;

            for (const index in this.checkoutValidation)
            {
                if (this.checkoutValidation[index].validate)
                {
                    this.checkoutValidation[index].validate();

                    if (this.checkoutValidation[index].showError)
                    {
                        isValid = !this.checkoutValidation[index].showError;
                    }
                }
            }

            return isValid;
        },

        afterPreparePayment(response)
        {
            var paymentType = response.type || "errorCode";
            var paymentValue = response.value || "";

            switch (paymentType)
            {
            case "continue":
                var target = this.targetContinue;

                if (target)
                    {
                    window.location.assign(target);
                }
                break;
            case "redirectUrl":
                    // redirect to given payment provider
                window.location.assign(paymentValue);
                break;
            case "externalContentUrl":
                    // show external content in iframe
                this.showModal(paymentValue, true);
                break;
            case "htmlContent":
                this.showModal(paymentValue, false);
                break;

            case "errorCode":
                NotificationService.error(paymentValue);
                this.waiting = false;
                break;
            default:
                NotificationService.error("Unknown response from payment provider: " + paymentType);
                this.waiting = false;
                break;
            }
        },

        showModal(content, isExternalContent)
        {
            var $modal = $(this.$els.modal);
            var $modalBody = $(this.$els.modalContent);

            if (isExternalContent)
            {
                $modalBody.html("<iframe src=\"" + content + "\">");
            }
            else
            {
                $modalBody.html(content);
            }

            $modal.modal("show");
        }
    }
});

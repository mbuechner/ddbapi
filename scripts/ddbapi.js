const DDBLogoPlugin = function () {
    return {
        wrapComponents: {
            Topbar: (Original, {
                React
            }) => (props) => {
                return React.createElement("div", {
                    className: "topbar",
                    style: {
                        backgroundColor: "#efebe8"
                    }
                },
                    React.createElement("div", {
                        className: "wrapper"
                    },
                        React.createElement("img", {
                            className: "ddbLogo",
                            width: "200px",
                            src: "./logo-ddbpro.svg"
                        }),
                        null))
            }
        }
    }
}
